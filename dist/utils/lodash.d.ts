declare const _default: {
    pick: {
        <T extends object, U extends keyof T>(object: T, ...props: import("lodash").Many<U>[]): Pick<T, U>;
        <T_1>(object: T_1, ...props: import("lodash").Many<string | number | symbol>[]): Partial<T_1>;
    };
    isEmpty: (value?: any) => boolean;
    memoize: {
        <T_2 extends (...args: any) => any>(func: T_2, resolver?: (...args: Parameters<T_2>) => any): T_2 & import("lodash").MemoizedFunction;
        Cache: import("lodash").MapCacheConstructor;
    };
    pickBy: {
        <T_3, S extends T_3>(object: import("lodash").Dictionary<T_3>, predicate: import("lodash").ValueKeyIterateeTypeGuard<T_3, S>): import("lodash").Dictionary<S>;
        <T_4, S_1 extends T_4>(object: import("lodash").NumericDictionary<T_4>, predicate: import("lodash").ValueKeyIterateeTypeGuard<T_4, S_1>): import("lodash").NumericDictionary<S_1>;
        <T_5>(object: import("lodash").Dictionary<T_5>, predicate?: import("lodash").ValueKeyIteratee<T_5>): import("lodash").Dictionary<T_5>;
        <T_6>(object: import("lodash").NumericDictionary<T_6>, predicate?: import("lodash").ValueKeyIteratee<T_6>): import("lodash").NumericDictionary<T_6>;
        <T_7 extends object>(object: T_7, predicate?: import("lodash").ValueKeyIteratee<T_7[keyof T_7]>): Partial<T_7>;
    };
    get: {
        <TObject extends object, TKey extends keyof TObject>(object: TObject, path: TKey | [TKey]): TObject[TKey];
        <TObject_1 extends object, TKey_1 extends keyof TObject_1>(object: TObject_1, path: TKey_1 | [TKey_1]): TObject_1[TKey_1];
        <TObject_2 extends object, TKey_2 extends keyof TObject_2, TDefault>(object: TObject_2, path: TKey_2 | [TKey_2], defaultValue: TDefault): TDefault | Exclude<TObject_2[TKey_2], undefined>;
        <TObject_3 extends object, TKey1 extends keyof TObject_3, TKey2 extends keyof TObject_3[TKey1]>(object: TObject_3, path: [TKey1, TKey2]): TObject_3[TKey1][TKey2];
        <TObject_4 extends object, TKey1_1 extends keyof TObject_4, TKey2_1 extends keyof TObject_4[TKey1_1]>(object: TObject_4, path: [TKey1_1, TKey2_1]): TObject_4[TKey1_1][TKey2_1];
        <TObject_5 extends object, TKey1_2 extends keyof TObject_5, TKey2_2 extends keyof TObject_5[TKey1_2], TDefault_1>(object: TObject_5, path: [TKey1_2, TKey2_2], defaultValue: TDefault_1): TDefault_1 | Exclude<TObject_5[TKey1_2][TKey2_2], undefined>;
        <TObject_6 extends object, TKey1_3 extends keyof TObject_6, TKey2_3 extends keyof TObject_6[TKey1_3], TKey3 extends keyof TObject_6[TKey1_3][TKey2_3]>(object: TObject_6, path: [TKey1_3, TKey2_3, TKey3]): TObject_6[TKey1_3][TKey2_3][TKey3];
        <TObject_7 extends object, TKey1_4 extends keyof TObject_7, TKey2_4 extends keyof TObject_7[TKey1_4], TKey3_1 extends keyof TObject_7[TKey1_4][TKey2_4]>(object: TObject_7, path: [TKey1_4, TKey2_4, TKey3_1]): TObject_7[TKey1_4][TKey2_4][TKey3_1];
        <TObject_8 extends object, TKey1_5 extends keyof TObject_8, TKey2_5 extends keyof TObject_8[TKey1_5], TKey3_2 extends keyof TObject_8[TKey1_5][TKey2_5], TDefault_2>(object: TObject_8, path: [TKey1_5, TKey2_5, TKey3_2], defaultValue: TDefault_2): TDefault_2 | Exclude<TObject_8[TKey1_5][TKey2_5][TKey3_2], undefined>;
        <TObject_9 extends object, TKey1_6 extends keyof TObject_9, TKey2_6 extends keyof TObject_9[TKey1_6], TKey3_3 extends keyof TObject_9[TKey1_6][TKey2_6], TKey4 extends keyof TObject_9[TKey1_6][TKey2_6][TKey3_3]>(object: TObject_9, path: [TKey1_6, TKey2_6, TKey3_3, TKey4]): TObject_9[TKey1_6][TKey2_6][TKey3_3][TKey4];
        <TObject_10 extends object, TKey1_7 extends keyof TObject_10, TKey2_7 extends keyof TObject_10[TKey1_7], TKey3_4 extends keyof TObject_10[TKey1_7][TKey2_7], TKey4_1 extends keyof TObject_10[TKey1_7][TKey2_7][TKey3_4]>(object: TObject_10, path: [TKey1_7, TKey2_7, TKey3_4, TKey4_1]): TObject_10[TKey1_7][TKey2_7][TKey3_4][TKey4_1];
        <TObject_11 extends object, TKey1_8 extends keyof TObject_11, TKey2_8 extends keyof TObject_11[TKey1_8], TKey3_5 extends keyof TObject_11[TKey1_8][TKey2_8], TKey4_2 extends keyof TObject_11[TKey1_8][TKey2_8][TKey3_5], TDefault_3>(object: TObject_11, path: [TKey1_8, TKey2_8, TKey3_5, TKey4_2], defaultValue: TDefault_3): TDefault_3 | Exclude<TObject_11[TKey1_8][TKey2_8][TKey3_5][TKey4_2], undefined>;
        <T_8>(object: import("lodash").NumericDictionary<T_8>, path: number): T_8;
        <T_9>(object: import("lodash").NumericDictionary<T_9>, path: number): T_9;
        <T_10, TDefault_4>(object: import("lodash").NumericDictionary<T_10>, path: number, defaultValue: TDefault_4): T_10 | TDefault_4;
        <TDefault_5>(object: null, path: import("lodash").Many<string | number | symbol>, defaultValue: TDefault_5): TDefault_5;
        (object: null, path: import("lodash").Many<string | number | symbol>): undefined;
        (object: any, path: import("lodash").Many<string | number | symbol>, defaultValue?: any): any;
    };
    set: {
        <T_11 extends object>(object: T_11, path: import("lodash").Many<string | number | symbol>, value: any): T_11;
        <TResult>(object: object, path: import("lodash").Many<string | number | symbol>, value: any): TResult;
    };
    omitBy: {
        <T_12>(object: import("lodash").Dictionary<T_12>, predicate?: import("lodash").ValueKeyIteratee<T_12>): import("lodash").Dictionary<T_12>;
        <T_13>(object: import("lodash").NumericDictionary<T_13>, predicate?: import("lodash").ValueKeyIteratee<T_13>): import("lodash").NumericDictionary<T_13>;
        <T_14 extends object>(object: T_14, predicate: import("lodash").ValueKeyIteratee<T_14[keyof T_14]>): Partial<T_14>;
    };
    isNil: (value: any) => value is null;
    has: <T_15>(object: T_15, path: import("lodash").Many<string | number | symbol>) => boolean;
    defaultsDeep: (object: any, ...sources: any[]) => any;
};
export default _default;
