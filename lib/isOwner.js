const settings = require('../settings');
const { isSudo } = require('./index');
const { getOwnerNumbers } = require('./owner');

/**
 * Returns true if the given numeric string matches any of this customer's
 * owner numbers (from OWNER_NUMBER env / owner.json / settings).
 */
function matchesAnyOwner(numeric) {
    if (!numeric) return false;
    const owners = getOwnerNumbers();
    return owners.includes(numeric);
}

async function isOwnerOrSudo(senderId, sock = null, chatId = null) {
    // Owner numbers are resolved per-customer by lib/owner.js, which also
    // overrides settings.ownerNumber so legacy code keeps working.
    const ownerJids = new Set(getOwnerNumbers().map(n => n + '@s.whatsapp.net'));

    // Direct JID match (any owner)
    if (ownerJids.has(senderId)) {
        return true;
    }

    // Extract sender's numeric parts
    const senderIdClean = senderId.split(':')[0].split('@')[0];
    const senderLidNumeric = senderId.includes('@lid') ? senderId.split('@')[0].split(':')[0] : '';

    // Check if sender's phone number matches any owner number
    if (matchesAnyOwner(senderIdClean)) {
        return true;
    }

    // In groups, check if sender's LID matches bot's LID (owner uses same account as bot)
    if (sock && chatId && chatId.endsWith('@g.us') && senderId.includes('@lid')) {
        try {
            // Get bot's LID numeric
            const botLid = sock.user?.lid || '';
            const botLidNumeric = botLid.includes(':') ? botLid.split(':')[0] : (botLid.includes('@') ? botLid.split('@')[0] : botLid);

            // Check if sender's LID numeric matches bot's LID numeric
            if (senderLidNumeric && botLidNumeric && senderLidNumeric === botLidNumeric) {
                return true;
            }

            // Also check participant data for additional matching
            const metadata = await sock.groupMetadata(chatId);
            const participants = metadata.participants || [];

            const participant = participants.find(p => {
                const pLid = p.lid || '';
                const pLidNumeric = pLid.includes(':') ? pLid.split(':')[0] : (pLid.includes('@') ? pLid.split('@')[0] : pLid);
                const pId = p.id || '';
                const pIdClean = pId.split(':')[0].split('@')[0];

                return (
                    p.lid === senderId ||
                    p.id === senderId ||
                    pLidNumeric === senderLidNumeric ||
                    pIdClean === senderIdClean ||
                    matchesAnyOwner(pIdClean)
                );
            });

            if (participant) {
                const participantId = participant.id || '';
                const participantLid = participant.lid || '';
                const participantIdClean = participantId.split(':')[0].split('@')[0];
                const participantLidNumeric = participantLid.includes(':') ? participantLid.split(':')[0] : (participantLid.includes('@') ? participantLid.split('@')[0] : participantLid);

                if (ownerJids.has(participantId) ||
                    matchesAnyOwner(participantIdClean) ||
                    participantLidNumeric === botLidNumeric) {
                    return true;
                }
            }
        } catch (e) {
            console.error('❌ [isOwner] Error checking participant data:', e);
        }
    }

    // Check if sender ID contains any owner number (fallback)
    for (const ownerNumberClean of getOwnerNumbers()) {
        if (ownerNumberClean && senderId.includes(ownerNumberClean)) {
            return true;
        }
    }

    // Check sudo status
    try {
        return await isSudo(senderId);
    } catch (e) {
        console.error('❌ [isOwner] Error checking sudo:', e);
        return false;
    }
}

module.exports = isOwnerOrSudo;
