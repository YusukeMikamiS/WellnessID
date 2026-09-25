/** palette.js の型。値は palette.js にのみ書く。 */

interface PaletteTheme {
  readonly bg: string;
  readonly surface: string;
  readonly ink: string;
  readonly inkMuted: string;
  readonly primary: string;
  readonly primaryStrong: string;
  readonly primarySoft: string;
  readonly line: string;
  readonly tint: string;
}

interface PaletteKindColor {
  readonly fg: string;
  readonly bg: string;
}

export declare const community: PaletteTheme;
export declare const member: PaletteTheme;
export declare const kindColors: {
  readonly product: PaletteKindColor;
  readonly service: PaletteKindColor;
  readonly pro: PaletteKindColor;
};
export declare const semantic: {
  readonly star: string;
  readonly success: string;
  readonly danger: string;
};
