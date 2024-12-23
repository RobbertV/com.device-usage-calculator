'use strict';

import Homey from 'homey';
import { v4 as uuidv4 } from 'uuid';

export default class BaseDriver extends Homey.Driver {
    async onInit() {
        this.homey.app.log('[Driver] - init', this.id);
        this.homeyLanguage = this.homey.i18n.getLanguage();
    }

    async onPair(session) {
        this.homey.app.log(`[Driver] - onPair`, this.id);

        // session.setHandler('showView', async (viewId, data) => {
        //     this.homey.app.log(`[Driver] - onPair - showView`, { viewId, data });
        // });

        session.setHandler('list_devices', async () => {
            this.homey.app.log(`[Driver] - onPair - list_devices`, this.manifest.name[this.homeyLanguage]);

            return [
                {
                    name: this.manifest.name[this.homeyLanguage],
                    data: {
                        id: uuidv4()
                    },
                    settings: {
                        ...this.manifest.settings
                    }
                }
            ];
        });
    }
}
