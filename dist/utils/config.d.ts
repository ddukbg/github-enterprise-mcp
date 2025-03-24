import { z } from 'zod';
declare const ConfigSchema: z.ZodObject<{
    baseUrl: z.ZodDefault<z.ZodString>;
    token: z.ZodOptional<z.ZodString>;
    userAgent: z.ZodDefault<z.ZodString>;
    timeout: z.ZodDefault<z.ZodNumber>;
    debug: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    baseUrl: string;
    userAgent: string;
    timeout: number;
    debug: boolean;
    token?: string | undefined;
}, {
    baseUrl?: string | undefined;
    token?: string | undefined;
    userAgent?: string | undefined;
    timeout?: number | undefined;
    debug?: boolean | undefined;
}>;
export type Config = z.infer<typeof ConfigSchema>;
export declare function loadConfig(overrides?: Partial<Config>): Config;
export declare const defaultConfig: {
    baseUrl: string;
    userAgent: string;
    timeout: number;
    debug: boolean;
    token?: string | undefined;
};
export declare function buildApiUrl(config: Config, path: string): string;
export {};
