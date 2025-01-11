const init = async function (homey) {
    const startUsageSession = homey.flow.getActionCard('start-usage-session');
    startUsageSession.registerRunListener(async (args, state) => {
        homey.app.log('[Actions] - startUsageSession');
        await args.device.startUsage(args.price, args.meter);

        homey.api.realtime('updateDevice');
    });

    const endUsageSession = homey.flow.getActionCard('end-usage-session');
    endUsageSession.registerRunListener(async (args, state) => {
        homey.app.log('[Actions] - endUsageSession');
        await args.device.endUsage(args.price, args.meter);
        homey.api.realtime('updateDevice');
    });

    const updateUsageSession = homey.flow.getActionCard('update-usage-session');
    updateUsageSession.registerRunListener(async (args, state) => {
        homey.app.log('[Actions] - updateUsageSession');
        await args.device.updatePriceAndMeter(args.price, args.meter);

        homey.api.realtime('updateDevice');
    });

    const getFormattedSessionCosts = homey.flow.getActionCard('get-formatted-session-costs');
    getFormattedSessionCosts.registerRunListener(async (args) => {
        homey.app.log('[Action] - getFormattedSessionCosts');
        const setLocalCurrency = await args.device.formattedCosts();

        return {
            formattedCosts: setLocalCurrency
        };
    });
};

export default init;
