'use strict';

import Homey from 'homey';
import flowActions from './lib/flows/actions.mjs';

class DeviceUsageCalculatorApp extends Homey.App {
    trace() {
        console.log.bind(this, '[trace]').apply(this, arguments);
    }

    debug() {
        console.debug.bind(this, '[debug]').apply(this, arguments);
    }

    info() {
        console.log.bind(this, '[info]').apply(this, arguments);
    }

    log() {
        console.log.bind(this, '[log]').apply(this, arguments);
    }

    warn() {
        console.warn.bind(this, '[warn]').apply(this, arguments);
    }

    error() {
        console.error.bind(this, '[error]').apply(this, arguments);
    }

    fatal() {
        console.error.bind(this, '[fatal]').apply(this, arguments);
    }

    // -------------------- INIT ----------------------

    async onInit() {
        this.homey.app.log(`${this.homey.manifest.id} - ${this.homey.manifest.version} started...`);

        await flowActions(this.homey);
        await this.setupWidget();
    }

    async sendNotifications() {
        try {
            // const ntfy1 = `[Power Price] (1/2) - `;
            // const ntfy2 = `[Power Price] (2/2) - `;
            // await this.homey.notifications.createNotification({
            //     excerpt: ntfy2
            // });
            // await this.homey.notifications.createNotification({
            //     excerpt: ntfy1
            // });
        } catch (error) {
            this.homey.app.error('sendNotifications - error', console.error());
        }
    }

    async setupWidget() {
        const widget = this.homey.dashboards.getWidget('power-price-device-values');

        widget.registerSettingAutocompleteListener('device', async (query, settings) => {
            let devices = [];
            const drivers = await this.homey.drivers.getDrivers();
            // this.log('[setupWidget] - get drivers:', Object.keys(drivers));

            for (const driverKey of Object.keys(drivers)) {
                const driver = await this.homey.drivers.getDriver(driverKey);
                // this.log('[setupWidget] - get driver:', Object.keys(driver));

                const newDevice = driver.getDevices();

                devices = [...devices, ...newDevice];
            }

            this.log('[setupWidget] - Autocomplete query:', query, devices);
            // this.log('[Widget] Get devices', devices[0].getData().id);

            const foundDevices = devices.map((device) => {
                return {
                    name: device.getName(),
                    id: device.getData().id
                };
            });

            return foundDevices.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()));
        });
    }
}

export default DeviceUsageCalculatorApp;
