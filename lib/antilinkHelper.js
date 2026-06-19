const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || './data';
const antilinkFilePath = path.join(DATA_DIR, 'antilinkSettings.json');

function loadAntilinkSettings() {
    if (fs.existsSync(antilinkFilePath)) {
        const data = fs.readFileSync(antilinkFilePath);
        return JSON.parse(data);
    }
    return {};
}

function saveAntilinkSettings(settings) {
    fs.writeFileSync(antilinkFilePath, JSON.stringify(settings, null, 2));
}

function setAntilinkSetting(groupId, type) {
    const settings = loadAntilinkSettings();
    settings[groupId] = type;
    saveAntilinkSettings(settings);
}

function getAntilinkSetting(groupId) {
    const settings = loadAntilinkSettings();
    return settings[groupId] || 'off';
}

module.exports = {
    setAntilinkSetting,
    getAntilinkSetting
};
