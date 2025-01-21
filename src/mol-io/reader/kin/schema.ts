/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author ReliaSolve <russ@reliasolve.com>
 */

import { Column } from '../../../mol-data/db';

// @todo Point to format description
// http://paulbourke.net/dataformats/ply/
// https://en.wikipedia.org/wiki/PLY_(file_format)

export const KinTypeByteLength = {
    'char': 1,
    'uchar': 1,
    'short': 2,
    'ushort': 2,
    'int': 4,
    'uint': 4,
    'float': 4,
    'double': 8,

    'int8': 1,
    'uint8': 1,
    'int16': 2,
    'uint16': 2,
    'int32': 4,
    'uint32': 4,
    'float32': 4,
    'float64': 8
};
export type KinType = keyof typeof KinTypeByteLength
export const KinTypes = new Set(Object.keys(KinTypeByteLength));
export function KinType(str: string) {
    if (!KinTypes.has(str)) throw new Error(`unknown ply type '${str}'`);
    return str as KinType;
}

export interface KinFile {
    readonly comments: ReadonlyArray<string>
    readonly elementNames: ReadonlyArray<string>
    getElement(name: string): KinElement | undefined
}

export function KinFile(elements: KinElement[], elementNames: string[], comments: string[]): KinFile {
    const elementMap = new Map<string, KinElement>();
    for (let i = 0, il = elementNames.length; i < il; ++i) {
        elementMap.set(elementNames[i], elements[i]);
    }
    return {
        comments,
        elementNames,
        getElement: (name: string) => {
            return elementMap.get(name);
        }
    };
}

export type KinElement = KinTable | KinList

export interface KinTable {
    readonly kind: 'table'
    readonly rowCount: number
    readonly propertyNames: ReadonlyArray<string>
    readonly propertyTypes: ReadonlyArray<KinType>
    getProperty(name: string): Column<number> | undefined
}

export interface KinListValue {
    readonly entries: ArrayLike<number>
    readonly count: number
}

export interface KinList {
    readonly kind: 'list'
    readonly rowCount: number,
    readonly name: string,
    readonly type: KinType,
    value: (row: number) => KinListValue
}