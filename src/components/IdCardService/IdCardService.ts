

class IdCardService {
    private static readonly REF_NUMBER: string[] = ["1", "0", "X", "9", "8", "7", "6", "5", "4", "3", "2"];
    private static readonly POWER: number[] = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
    /**
     * This regexp doesn't work on last letter of X
     * 31023019910401075X TODO
     */
    private static readonly PATTERN = /^(?:[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\x|\d])|(?:1[1-5]\d{5}19\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\x|\d])$/;
    private static readonly PROVINCE_CODE_MAP: Map<string, string> = new Map<string, string>([
        ["11", "北京"], ["12", "天津"], ["13", "河北"], ["14", "山西"], ["15", "内蒙古"], ["21", "辽宁"],
        ["22", "吉林"], ["23", "黑龙江"], ["31", "上海"], ["32", "江苏"], ["33", "浙江"], ["34", "安徽"],
        ["35", "福建"], ["36", "江西"], ["37", "山东"], ["41", "河南"], ["42", "湖北"], ["43", "湖南"],
        ["44", "广东"], ["45", "广西"], ["46", "海南"], ["50", "重庆"], ["51", "四川"], ["52", "贵州"],
        ["53", "云南"], ["54", "西藏"], ["61", "陕西"], ["62", "甘肃"], ["63", "青海"], ["64", "宁夏"],
        ["65", "新疆"], ["71", "台湾"], ["81", "香港"], ["82", "澳门"], ["91", "国外"]
    ]);


    public province: string;
    public city: string;
    public region: string;
    public year: number;
    public month: number;
    public day: number;
    public gender: string;
    public birthday: Date;
    private idNo: string;

    constructor(idNo: string) {
        this.idNo = idNo;
    }

    public check(): boolean {
        return IdCardService.check(this.idNo);
    }

    public extractor(): IdCardService {
        this.province = IdCardService.PROVINCE_CODE_MAP.get(this.idNo.substring(0, 2)) || "";
        this.gender = parseInt(this.idNo.substring(16, 17), 10) % 2 !== 0 ? "男" : "女";
        this.birthday = IdCardService.parseDateFromString(this.idNo.substring(6, 14));
        this.year = this.birthday.getFullYear();
        this.month = this.birthday.getMonth() + 1; // Adjust for 0-based month index
        this.day = this.birthday.getDate();

        return this;
    }

    public static check(idNo: string): boolean {
        if (!idNo || idNo.length !== 18 || !IdCardService.PATTERN.test(idNo) || !IdCardService.PROVINCE_CODE_MAP.has(idNo.substring(0, 2))) {
            return false;
        }

        try {
            IdCardService.parseDateFromString(idNo.substring(6, 14));
        } catch (e) {
            return false;
        }

        return IdCardService.checkIdNoLastNum(idNo);
    }

    private static checkIdNoLastNum(idNo: string): boolean {
        let sum17 = 0;
        for (let i = 0; i < 17; i++)
            sum17 += IdCardService.POWER[i] * parseInt(idNo[i], 10);

        return idNo.substring(17, 18).toUpperCase() === IdCardService.REF_NUMBER[sum17 % 11];
    }

    private static parseDateFromString(input: string): Date {
        const date = new Date();
        // Check if the input string is in the correct format
        if (input.length != 8)
            throw new Error('Invalid date format. Expected yyyyMMdd.');

        // Extract year, month, and day components
        const year = parseInt(input.substring(0, 4), 10);
        const month = parseInt(input.substring(4, 6), 10) - 1; // Adjust for 0-based month index
        const day = parseInt(input.substring(6, 8), 10);

        // Create a Date object and set the year, month, and day

        date.setFullYear(year);
        date.setMonth(month);
        date.setDate(day);

        return date;
    }
}

export default IdCardService;