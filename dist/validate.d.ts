export declare function getValidatorOfEntity(EntityClass: any, useCache?: boolean): any;
export declare function validateEntity(EntityClass: any, value: any, useCache?: boolean): Promise<{
    valid: boolean;
    errors?: {
        message: string;
        field: string;
    }[];
    fields?: any;
}>;
