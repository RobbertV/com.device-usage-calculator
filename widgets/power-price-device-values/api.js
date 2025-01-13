'use strict';

async function getDevice({ homey, deviceId }) {
    if (!homey) {
        throw new Error('Missing Homey');
    }

    if (!deviceId) {
        throw new Error('Missing Device deviceId');
    }
    // ToDo: refactor to simplified variant with provided driverId
    let devices = [];
    const drivers = await homey.drivers.getDrivers();

    for await (const driverKey of Object.keys(drivers)) {
        const driver = await homey.drivers.getDriver(driverKey);
        const newDevice = driver.getDevices();

        devices = [...devices, ...newDevice];
    }

    const selectedDevice = devices.find((device) => device.getData().id === deviceId);
    if (!selectedDevice) {
        throw new Error('[Widget API] [getDevice] Power Price device Not Found');
    }

    return selectedDevice;
}

async function getUnit({ usageCapability }) {
    const unitMap = {
        meter_gas: 'm3',
        'meter_gas.imperial': 'ft3',
        'measure_content_volume.gj': 'GJ',
        meter_power: 'kWh',
        measure_content_volume: 'L',
        'measure_content_volume.imperial': 'gal',
        meter_water: 'm3',
        'meter_water.imperial': 'ft3',
        measure_power: 'W',
        measure_weight: 'kg',
        'measure_weight.imperial': 'oz'
    };
    return unitMap[usageCapability] || '';
}

async function getUsageCapability({ device }) {
    const arrayToFilter = ['measure_monetary', 'measure_duration', 'alarm_running'];
    let deviceCapabilities = device.getCapabilities();
    let getusageCapability = deviceCapabilities.find((d) => !arrayToFilter.some((atf) => d.startsWith(atf)));

    // console.log('[capabilityOptions]:', deviceCapabilities, getusageCapability);

    return getusageCapability;
}

async function getFormattedMonetaryValue({ device, deviceSettings, i18n }) {
    const unit = deviceSettings.monetary_unit;
    let currencyUnit = 'EUR';

    if (unit.includes('.')) {
        currencyUnit = unit.split('.')[1];
    }
    return device.getCapabilityValue('measure_monetary').toLocaleString(i18n, { style: 'currency', currency: currencyUnit });
}

async function getTimestamp({ i18n }) {
    const date = new Date();
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
    };

    return new Intl.DateTimeFormat(i18n, options).format(date);
}

module.exports = {
    async getDeviceCapabilities({ homey, query }) {
        console.log('[getDeviceCapabilities] - ', query);
        const { deviceId } = query;
        const device = await getDevice({ homey, deviceId });

        // console.log('[getDeviceCapabilities] - ', device);
        const deviceSettings = device.getSettings();
        const i18n = homey.i18n.getLanguage();

        const timestamp = await getTimestamp({ i18n });
        const formattedCosts = await getFormattedMonetaryValue({ device, deviceSettings, i18n });
        const usageCapability = await getUsageCapability({ device });
        const unit = await getUnit({ usageCapability });

        const usage = device.getCapabilityValue(usageCapability).toFixed(2);

        return {
            lastUpdate: timestamp,
            name: device.getName(),
            usage,
            unit,
            duration: device.getCapabilityValue('measure_duration'),
            costs: formattedCosts,
            isRunning: device.getCapabilityValue('alarm_running')
        };
    }
};
