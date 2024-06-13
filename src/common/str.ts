/**
 * String Utils
 */

/**
 * 随机字符串
 * 
 * @param len 长度
 * @returns 随机字符串
 */
function randomString(len: number): string {
    let $chars: string = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';    /****默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1****/
    let maxPos: number = $chars.length;
    let result: string = '';

    for (let i = 0; i < len; i++)
        result += $chars.charAt(Math.floor(Math.random() * maxPos));

    return result;
}

/**
 * 
 * @param message 
 * @returns 
 */
async function md5(message: string) {
    const msgUint8 = new TextEncoder().encode(message) // encode as (utf-8) Uint8Array
    const hashBuffer = await crypto.subtle.digest('MD5', msgUint8) // hash the message
    const hashArray = Array.from(new Uint8Array(hashBuffer)) // convert buffer to byte array

    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('') // convert bytes to hex string
}


const stringTemplateReg: RegExp = /\{(\w+)\}/g;

function stringTemplate(str: string, data: any): string {
    return str.replace(stringTemplateReg, function (m, key) {
        return data.hasOwnProperty(key) ? data[key] : m;
    });
}

export {
    randomString, md5, stringTemplate
}