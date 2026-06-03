export class DebeziumDateUtil {
    // Converte YYYYMMDD em Date
    static parseYYYYMMDD(dt: any): Date | null {
        if (!dt) return null;
        const str = dt.toString().padStart(8, '0');
        const year = Number(str.substring(0, 4));
        const month = Number(str.substring(4, 6)) - 1;
        const day = Number(str.substring(6, 8));
        if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
        const date = new Date(year, month, day);
        return isNaN(date.getTime()) ? null : date;
    }

    // Converte dias desde epoch (1/1/1970) para Date
    static convertEpochDays(days: any): Date | null {
        if (days === null || days === undefined || days === '' || isNaN(days)) return null;
        const num = Number(days);
        
        // Tratar o valor 18767 - que parece ser dias desde uma data base
        const base = new Date(1970, 0, 1);
        base.setDate(base.getDate() + num);

        return isNaN(base.getTime()) ? null : base;
    }

    // Converte nanossegundos em HH:mm:ss
    static convertNanoToTime(ns: number): string | null {
        if (!ns || isNaN(ns)) return null;
        const seconds = Math.floor(ns / 1_000_000_000);
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Converte timestamp em nanossegundos para Date
    static convertNanoTimestamp(num: any): Date | null {
        if (!num || isNaN(num)) return null;
        const val = Number(num);
        return new Date(val / 1_000_000);
    }
}