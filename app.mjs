'use strict';

import Homey from 'homey';
import flowActions from './lib/flows/actions.mjs';
// import flowConditions from './lib/flows/conditions.mjs';

class DynamicMeasureApp extends Homey.App {
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
        // await flowConditions(this.homey);
    }


    async sendNotifications() {
        try {
            // const ntfy2023100401 = `[Usage Mate] (1/2) - Good news. This app version doesn't require the cloud server anymore`;
            // const ntfy2023100402 = `[Usage Mate] (2/2) - The complete connection is now running natevely on your Homey.`;
            // await this.homey.notifications.createNotification({
            //     excerpt: ntfy2023100402
            // });
            // await this.homey.notifications.createNotification({
            //     excerpt: ntfy2023100401
            // });
        } catch (error) {
            this.homey.app.error('sendNotifications - error', console.error());
        }
    }
}

export default DynamicMeasureApp;
