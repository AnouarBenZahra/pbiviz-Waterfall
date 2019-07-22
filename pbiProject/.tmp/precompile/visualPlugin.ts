import { Visual } from "../../src/visual";
var powerbiKey = "powerbi";
var powerbi = window[powerbiKey];

var pbiProject98C7303784804BA5BF4C2D3591D8461B_DEBUG = {
    name: 'pbiProject98C7303784804BA5BF4C2D3591D8461B_DEBUG',
    displayName: 'pbiProject',
    class: 'Visual',
    version: '1.0.0',
    apiVersion: '2.6.0',
    create: (options) => {
        if (Visual) {
            return new Visual(options);
        }

        console.error('Visual instance not found');
    },
    custom: true
};

if (typeof powerbi !== "undefined") {
    powerbi.visuals = powerbi.visuals || {};
    powerbi.visuals.plugins = powerbi.visuals.plugins || {};
    powerbi.visuals.plugins["pbiProject98C7303784804BA5BF4C2D3591D8461B_DEBUG"] = pbiProject98C7303784804BA5BF4C2D3591D8461B_DEBUG;
}

export default pbiProject98C7303784804BA5BF4C2D3591D8461B_DEBUG;