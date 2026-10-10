# Editorial fonts

Inter, PT Serif, Noto Sans Bengali, and Noto Sans Devanagari are sourced from Google Fonts (fonts.gstatic.com). Original static TrueType files were converted losslessly to WOFF2 with FontTools. The upstream SIL Open Font License for each family is included here.

The shared loader in `src/styles/fonts.ts` serves these assets locally. Native-script families load on demand, and builds do not need to fetch this theme's fonts from Google.

`inter-900-loader.woff2` is the Latin subset of Inter Black from Google Fonts, used for the fullscreen loader. It shares the included Inter license and loads on demand.
