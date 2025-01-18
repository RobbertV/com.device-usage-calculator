'use strict';

import Homey from 'homey';
import { sleep, formattedDuration } from '../lib/helpers.mjs';
import { differenceInMilliseconds } from 'date-fns';

export default class BaseDevice extends Homey.Device {
    async onInit() {
        this.homey.app.log('[Device] - init =>', this.getName(), this.driver.manifest.id);

        await this.checkCapabilities();
    }

    async onAdded() {
        this.homey.app.log('[Device] - onAdded =>', this.getName());
        await this.setStoreValues();
        await this.resetValues();
    }

    async onSettings({ newSettings, changedKeys }) {
        this.homey.app.log('[Device] - onSettings =>', this.driver.id, newSettings);

        // Todo: fix bug where capability label gets reset.
        if (changedKeys.some((k) => k === 'monetary_unit' || k === 'costs_decimals')) {
            const costs = (this.getStoreValue('costs') && this.getStoreValue('costs').value) || 0;
            const newOptions = newSettings.costs_decimals ? { decimals: newSettings.costs_decimals } : false;

            await this.checkCapabilities(newSettings);
            await this.setMonetaryCapability(costs, newOptions);
        }

        if (changedKeys.some((k) => k === 'usage_decimals')) {
            const newOptions = { decimals: newSettings.usage_decimals };
            const usage = (this.getStoreValue('usage') && this.getStoreValue('usage').value) || 0;

            // await this.checkCapabilities(newSettings);
            await this.setUsageCapability(usage, newOptions);
        }
    }

    async onDeleted() {
        this.homey.app.log('[Device] - on =>', this.getName());
    }

    // ---------- Store Values -----------

    async setStoreValues(price = 0, meter = 0) {
        this.homey.app.log(`[Device] ${this.getName()} - setStoreValues`, { price, meter });

        this.setStoreValue('usage', { value: 0 });
        this.setStoreValue('costs', { value: 0 });
        this.setStoreValue('calculation-values', {
            price,
            meter,
            starttime: new Date()
        });
    }

    async resetValues() {
        const settings = this.getSettings();
        const showSecSettings = settings.show_duration_seconds;
        const prettyDuration = formattedDuration(0, this.homey.__, showSecSettings);

        await this.setCapabilityValue('alarm_running', false);
        await this.setCapabilityValue('measure_duration', prettyDuration);
        await this.setMonetaryCapability(0);
        await this.setUsageCapability(0);
    }

    // ---------- Usage Calculation -----------

    async startUsage(price, meter) {
        const settings = this.getSettings();

        this.setStoreValues(price, meter);

        if (settings.resetValues) {
            await this.resetValues();
        }

        await this.setCapabilityValue('alarm_running', true);
    }

    async endUsage(price, meter) {
        if (this.getCapabilityValue('alarm_running') === false) {
            throw new Error('Theres no session running');
        }

        await this.updatePriceAndMeter(price, meter);
        await this.calculateTotals();
    }

    async updatePriceAndMeter(price, meter) {
        if (this.getCapabilityValue('alarm_running') === false) {
            throw new Error('Theres no session running');
        }

        const calculationValues = this.getStoreValue('calculation-values');

        this.homey.app.log(`[Device] ${this.getName()} - updatePriceAndMeter =>`, { price, meter, calculationValues });

        const diffMeter = meter - calculationValues.meter;

        await this.updateUsage(diffMeter);
        await this.updateCosts(diffMeter);

        this.setStoreValue('calculation-values', { ...calculationValues, price, meter });
    }

    async updateUsage(newValue) {
        const oldUsage = this.getStoreValue('usage');
        const previousValue = oldUsage.value || 0;

        this.homey.app.log(`[Device] ${this.getName()} - updateUsage =>`, { previousValue, newValue });

        // Set new usage value and update the timestamp
        await this.setStoreValue('usage', { value: previousValue + newValue });

        this.homey.app.log(`[Device] ${this.getName()} - updateUsage =>`, { value: previousValue + newValue });
    }

    async updateCosts(usage) {
        const settings = this.getSettings();
        const calculationValues = this.getStoreValue('calculation-values');
        const price = calculationValues.price;
        const oldCosts = this.getStoreValue('costs');
        const previousCosts = oldCosts.value || 0;

        // Calculate the costs
        const costs = price * usage;

        this.homey.app.log(`[Device] ${this.getName()} - updateCosts =>`, { previousCosts, costs, usage });

        await this.setStoreValue('costs', { value: previousCosts + costs });

        this.homey.app.log(`[Device] ${this.getName()} - updateCosts =>`, { value: previousCosts + costs });

        if (settings.update_values) {
            this.calculateTotals(true);
        }
    }

    async calculateTotals(isRunning = false) {
        try {
            const endTime = new Date();
            const settings = this.getSettings();
            const showSecSettings = settings.show_duration_seconds;
            const usage = this.getStoreValue('usage');
            const costs = this.getStoreValue('costs');
            const calculationValues = this.getStoreValue('calculation-values');

            const diffMs = differenceInMilliseconds(endTime, calculationValues.starttime);
            const duration = diffMs / (1000 * 60); // If minite is lower than 1, it will show 0.5 for example
            const prettyDuration = formattedDuration(diffMs, this.homey.__, showSecSettings);

            this.homey.app.log(`[Device] ${this.getName()} - calculateTotals =>`, { usage, costs, duration, prettyDuration, showSecSettings });

            this.setCapabilityValue('measure_duration', prettyDuration);
            this.setCapabilityValue('alarm_running', isRunning);
            this.setMonetaryCapability(costs.value);
            this.setUsageCapability(usage.value);
        } catch (error) {
            this.homey.app.error(error);
        }
    }

    async formattedCosts() {
        try {
            const i18nLang = this.homey.i18n.getLanguage();
            const settings = this.getSettings();
            const deviceCapabilities = this.getCapabilities();
            const getMonetaryCapability = deviceCapabilities.find((d) => d.startsWith('measure_monetary'));
            const rawCostsValue = this.getCapabilityValue(getMonetaryCapability);
            const unit = settings.monetary_unit;
            let currencyUnit = 'EUR';

            if (unit.includes('.')) {
                currencyUnit = unit.split('.')[1];
            }

            const formattedCosts = rawCostsValue.toLocaleString(i18nLang, { style: 'currency', currency: currencyUnit });

            this.homey.app.log(`[Device] ${this.getName()} - formattedCosts =>`, { currencyUnit, formattedCosts });

            return formattedCosts;
        } catch (error) {
            this.homey.app.error(error);
        }
    }

    // ---------- Capabilities -----------

    async setUsageCapability(value, capabilityOptions = false) {
        try {
            const arrayToFilter = ['measure_monetary', 'measure_duration', 'alarm_running'];
            let deviceCapabilities = this.getCapabilities();
            let getusageCapability = deviceCapabilities.find((d) => !arrayToFilter.some((atf) => d.startsWith(atf)));

            if (!getusageCapability) {
                this.homey.app.log(`[Device] ${this.getName()} - setUsageCapability => No usage capability found, retrying in 5 seconds`);

                await sleep(5000);
                deviceCapabilities = this.getCapabilities();
                getusageCapability = deviceCapabilities.find((d) => !arrayToFilter.some((atf) => d.startsWith(atf)));
            }

            if (capabilityOptions) {
                this.homey.app.log(`[Device] ${this.getName()} - setCapabilityOption =>`, getusageCapability, capabilityOptions);

                const currentCapabilityOptions = await this.getCapabilityOptions(getusageCapability);
                const mergedCapabilityOptions = { ...currentCapabilityOptions, ...capabilityOptions };

                this.homey.app.log(`[Device] ${this.getName()} - setUsageCapabilityOption =>`, {
                    getusageCapability,
                    capabilityOptions,
                    currentCapabilityOptions,
                    mergedCapabilityOptions
                });
                

                await this.setCapabilityOptions(getusageCapability, mergedCapabilityOptions);
            }
            this.homey.app.log(`[Device] ${this.getName()} - setUsageCapability =>`, getusageCapability, value, capabilityOptions);

            this.setCapabilityValue(getusageCapability, value);
        } catch (error) {
            this.homey.app.error(error);
        }
    }

    async setMonetaryCapability(value, capabilityOptions = false) {
        try {
            let deviceCapabilities = this.getCapabilities();
            let getMonetaryCapability = deviceCapabilities.find((d) => d.startsWith('measure_monetary'));

            if (!getMonetaryCapability) {
                this.homey.app.log(`[Device] ${this.getName()} - setMonetaryCapability => No monetary capability found, retrying in 5 seconds`);

                await sleep(5000);
                deviceCapabilities = this.getCapabilities();
                getMonetaryCapability = deviceCapabilities.find((d) => d.startsWith('measure_monetary'));
            }

            if (capabilityOptions) {
                const currentCapabilityOptions = await this.getCapabilityOptions(getMonetaryCapability);
                const mergedCapabilityOptions = { ...currentCapabilityOptions, ...capabilityOptions };

                this.homey.app.log(`[Device] ${this.getName()} - setMonetaryCapabilityOption =>`, {
                    getMonetaryCapability, 
                    capabilityOptions, 
                    currentCapabilityOptions, 
                    mergedCapabilityOptions
                });
                

                await this.setCapabilityOptions(getMonetaryCapability, mergedCapabilityOptions);
            }
            this.homey.app.log(`[Device] ${this.getName()} - setMonetaryCapability =>`, getMonetaryCapability, value, capabilityOptions);

            this.setCapabilityValue(getMonetaryCapability, value);
        } catch (error) {
            this.homey.app.error(error);
        }
    }

    async checkCapabilities(overrideSettings = false) {
        const settings = overrideSettings || this.getSettings();
        const driverCapabilities = this.driver.manifest.capabilities.filter((c) => c !== 'measure_monetary');
        const deviceCapabilities = this.getCapabilities();
        const settingsCapabilities = [settings.monetary_unit];
        const combinedCapabilities = [...new Set([...driverCapabilities, ...settingsCapabilities])];

        this.homey.app.log(`[Device] ${this.getName()} - Found capabilities =>`, deviceCapabilities);

        await this.updateCapabilities(combinedCapabilities, deviceCapabilities);
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
