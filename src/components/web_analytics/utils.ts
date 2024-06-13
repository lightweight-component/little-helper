export function checkUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch (error) {
        return false;
    }
}

export function getUrlData(url: string): { pathname: string, hostname: string } {
    let { pathname, hostname } = new URL(url);

    return { pathname, hostname };
}

export async function insertAndReturnId(db: D1Database, sql: string, bind: unknown[]): Promise<number> {
    let stmt = db.prepare(sql);

    if (stmt && bind.length > 0)
        stmt = stmt.bind(...bind);

    let { success } = await stmt.run();

    if (success) {
        let last_insert_rowid = await db.prepare('SELECT last_insert_rowid() as lastInsertId').first('lastInsertId');

        if (last_insert_rowid)
            return Number(last_insert_rowid);
        else
            throw new Error('Insert failed');
    } else
        throw new Error('Insert failed');
}

export async function insert(db: D1Database, sql: string, bind: unknown[]): Promise<Boolean | null> {
    let stmt = db.prepare(sql);

    if (stmt && bind.length > 0)
        stmt = stmt.bind(...bind);

    let { success } = await stmt.run();

    if (success)
        return success;
    else
        throw new Error('Insert failed');
}

