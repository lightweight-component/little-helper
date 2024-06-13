export type BaseConfig = {
    isLoaded: boolean
};;

export function loadConfig(perfix: string, cfg: BaseConfig, kv: any): void {
    if (!cfg.isLoaded) {
        for (let i in cfg) {
            if (i === 'isLoaded') continue;
            let p: string = perfix + '_' + i;

            if (cfg[i] === null) {// required if sets null to config
                if (typeof kv[p] === 'undefined')
                    throw new Error(`${p} is required variable to set.`);
            }

            if (typeof kv[p] !== 'undefined') {
                if (typeof cfg[i] === 'function')
                    cfg[i] = cfg[i](kv[p]);
                else
                    cfg[i] = kv[p];
            } else {
                if (typeof cfg[i] === 'function')
                    cfg[i] = cfg[i]();
            }
        }

        cfg.isLoaded = true;
    }
}