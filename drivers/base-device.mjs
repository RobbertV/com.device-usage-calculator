'use strict';

import Homey from 'homey';
import { sleep } from '../lib/helpers.mjs';
import { differenceInMilliseconds } from 'date-fns';

export default class BaseDevice extends Homey.Device {
    async onInit() {
        this.homey.app.log('[Device] - init =>', this.getName(), this.driver.manifest.id);

        await this.checkCapabilities();
    }

    async onAdded() {
        this.homey.app.log('[Device] - onAdded =>', this.getName());
        this.setCapabilityValue('alarm_running', false);
        this.setCapabilityValue('measure_monetary', 0);
        this.setCapabilityValue('measure_duration', 0);
        this.setUsageCapability(0);
    }


    async startUsage(price, meter) {
        this.setStoreValue('usage', { value: 0 });
        this.setStoreValue('costs', { value: 0 });
        this.setStoreValue('calculation-values', {
            price,
            meter,
            starttime: new Date()
        });

        this.setCapabilityValue('alarm_running', true);
    }

    async endUsage(price, meter) {
        await this.updatePriceAndMeter(price, meter);
        await this.calculateTotals();
    }

    async updatePriceAndMeter(price, meter) {

        if(this.getCapabilityValue('alarm_running') === false) {
            throw new Error('Theres no session running');
        }

        const calculationValues = this.getStoreValue('calculation-values');

        this.homey.app.log(`[Device] ${this.getName()} - updatePriceAndMeter =>`, { price, meter });

        this.setStoreValue('calculation-values', { ...calculationValues, price, meter });


        const diffMeter = meter - calculationValues.meter;

        this.updateUsage(diffMeter);
    }


    async updateUsage(newValue) {
        this.homey.app.log(`[Device] ${this.getName()} - updateUsage =>`, newValue);

        const oldUsage = this.getStoreValue('usage');
        const previousValue = oldUsage.value || 0;

        this.homey.app.log(`[Device] ${this.getName()} - updateUsage =>`, { previousValue, newValue });

        // Set new usage value and update the timestamp
        await this.setStoreValue('usage', { value: previousValue + newValue });

        this.homey.app.log(`[Device] ${this.getName()} - updateUsage =>`, { value: previousValue + newValue });

        await this.updateCosts(previousValue + newValue - previousValue);
    }

    async updateCosts(usage) {
        this.homey.app.log(`[Device] ${this.getName()} - updateCosts =>`, usage);

        const calculationValues = this.getStoreValue('calculation-values');
        const price = calculationValues.price;
        const oldCosts = this.getStoreValue('costs');
        const previousCosts = oldCosts.value || 0;

        this.homey.app.log(`[Device] ${this.getName()} - updateCosts =>`, { previousCosts, usage });

        // Calculate the costs
        const costs = price * usage;
        await this.setStoreValue('costs', { value: previousCosts + costs });

        this.homey.app.log(`[Device] ${this.getName()} - updateCosts =>`, { value: previousCosts + costs });
    }

    async calculateTotals() {
        try {
            const endTime = new Date();
            const usage = this.getStoreValue('usage');
            const costs = this.getStoreValue('costs');
            const calculationValues = this.getStoreValue('calculation-values');
            
            const diffMs = differenceInMilliseconds(endTime, calculationValues.starttime);
            const duration = diffMs / (1000 * 60); // If minite is lower than 1, it will show 0.5 for example            
    
            this.homey.app.log(`[Device] ${this.getName()} - calculateTotals =>`, { usage, costs, duration });
    
            this.setCapabilityValue('measure_monetary', costs.value);
            this.setCapabilityValue('measure_duration', duration);
            this.setCapabilityValue('alarm_running', false);
            this.setUsageCapability(usage.value);
        } catch (error) {
            this.homey.app.error(error);
        }
    }

    async setUsageCapability(value) {
        const capabilities = this.driver.manifest.capabilities;
        const arrayToFilter = ['measure_monetary', 'measure_duration', 'alarm_running'];

        capabilities.filter((c) => !arrayToFilter.includes(c)).forEach((c) => {
            this.homey.app.log(`[Device] ${this.getName()} - setUsageCapability =>`, c, value);
            this.setCapabilityValue(c, value);
        });
    }

    // ---------- Capabilities -----------

    async checkCapabilities() {
        const driverManifest = this.driver.manifest;
        let driverCapabilities = driverManifest.capabilities;
        let deviceCapabilities = this.getCapabilities();

        this.homey.app.log(`[Device] ${this.getName()} - Found capabilities =>`, deviceCapabilities);

        await this.updateCapabilities(driverCapabilities, deviceCapabilities);
    }

    async updateCapabilities(driverCapabilities, deviceCapabilities) {
        try {
            const newC = driverCapabilities.filter((d) => !deviceCapabilities.includes(d));
            const oldC = deviceCapabilities.filter((d) => !driverCapabilities.includes(d));

            this.homey.app.debug(`[Device] ${this.getName()} - Got old capabilities =>`, oldC);
            this.homey.app.debug(`[Device] ${this.getName()} - Got new capabilities =>`, newC);

            oldC.forEach((c) => {
                this.homey.app.log(`[Device] ${this.getName()} - updateCapabilities => Remove `, c);
                this.removeCapability(c).catch((e) => this.homey.app.debug(e));
            });
            await sleep(500);
            newC.forEach((c) => {
                this.homey.app.log(`[Device] ${this.getName()} - updateCapabilities => Add `, c);
                this.addCapability(c).catch((e) => this.homey.app.debug(e));
            });
            await sleep(500);
        } catch (error) {
            this.homey.app.error(error);
        }
    }
}
