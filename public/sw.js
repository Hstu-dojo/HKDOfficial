if (!self.define) {
  let e,
    a = {};
  const c = (c, s) => (
    (c = new URL(c + ".js", s).href),
    a[c] ||
      new Promise((a) => {
        if ("document" in self) {
          const e = document.createElement("script");
          (e.src = c), (e.onload = a), document.head.appendChild(e);
        } else (e = c), importScripts(c), a();
      }).then(() => {
        let e = a[c];
        if (!e) throw new Error(`Module ${c} didn’t register its module`);
        return e;
      })
  );
  self.define = (s, i) => {
    const d =
      e ||
      ("document" in self ? document.currentScript.src : "") ||
      location.href;
    if (a[d]) return;
    let n = {};
    const r = (e) => c(e, d),
      f = { module: { uri: d }, exports: n, require: r };
    a[d] = Promise.all(s.map((e) => f[e] || r(e))).then((e) => (i(...e), n));
  };
}
define(["./workbox-83b758e3"], function (e) {
  "use strict";
  importScripts(),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        {
          url: "/AppImages/android/android-launchericon-144-144.png",
          revision: "7c45a29d6cbdd24b7ecdd52dea2f4a35",
        },
        {
          url: "/AppImages/android/android-launchericon-192-192.png",
          revision: "753243cd91ba82dd4ee9ccdb2f662c88",
        },
        {
          url: "/AppImages/android/android-launchericon-48-48.png",
          revision: "f660552f10fc8fd190ede4530d5201c7",
        },
        {
          url: "/AppImages/android/android-launchericon-512-512.png",
          revision: "ca7b1de190b172b4991b8529ac3a286a",
        },
        {
          url: "/AppImages/android/android-launchericon-72-72.png",
          revision: "6fa76dddc7f8dd7142fcc2637c4b31cb",
        },
        {
          url: "/AppImages/android/android-launchericon-96-96.png",
          revision: "6a81c9e83d0af87957ddb58bc847def4",
        },
        {
          url: "/AppImages/icons.json",
          revision: "5dbbc3fe59816e65ba28e355a58ea45c",
        },
        {
          url: "/AppImages/ios/100.png",
          revision: "36ab1fe37ce282da1dc8a821535b3474",
        },
        {
          url: "/AppImages/ios/1024.png",
          revision: "effd86344ba3b19014df0191250648f6",
        },
        {
          url: "/AppImages/ios/114.png",
          revision: "70ba2d4c2bbe678238bb219a58ec297a",
        },
        {
          url: "/AppImages/ios/120.png",
          revision: "bd824b90a017b07bc28e3cae585e965f",
        },
        {
          url: "/AppImages/ios/128.png",
          revision: "132b0b8d430e4e55b4ffb374e9ad5307",
        },
        {
          url: "/AppImages/ios/144.png",
          revision: "7c45a29d6cbdd24b7ecdd52dea2f4a35",
        },
        {
          url: "/AppImages/ios/152.png",
          revision: "fdef6916ab2009b9141cd7b957e0bc54",
        },
        {
          url: "/AppImages/ios/16.png",
          revision: "29ed4fd6e30a24b195e042fd3b98c3bf",
        },
        {
          url: "/AppImages/ios/167.png",
          revision: "c9c4605f10c05b046178583312dd2b7c",
        },
        {
          url: "/AppImages/ios/180.png",
          revision: "790e3a19b7ee54cac16c141613c84242",
        },
        {
          url: "/AppImages/ios/192.png",
          revision: "753243cd91ba82dd4ee9ccdb2f662c88",
        },
        {
          url: "/AppImages/ios/20.png",
          revision: "de323e38f42417d3818aec30deb7a79d",
        },
        {
          url: "/AppImages/ios/256.png",
          revision: "981b948f1570c803fbd9b1ffa53e4613",
        },
        {
          url: "/AppImages/ios/29.png",
          revision: "57a3e57dd224c1a0cb17d82fe4ca6b31",
        },
        {
          url: "/AppImages/ios/32.png",
          revision: "88186941d3ac2567b079bcd621788316",
        },
        {
          url: "/AppImages/ios/40.png",
          revision: "152e4731045e6369828f9f185e377088",
        },
        {
          url: "/AppImages/ios/50.png",
          revision: "262e0706a0126c84f1e549f13ba12c98",
        },
        {
          url: "/AppImages/ios/512.png",
          revision: "ca7b1de190b172b4991b8529ac3a286a",
        },
        {
          url: "/AppImages/ios/57.png",
          revision: "76dd33b85c7faf1020b8fd023342e527",
        },
        {
          url: "/AppImages/ios/58.png",
          revision: "8bce91e0a07e152eaad2f0dc876c5c75",
        },
        {
          url: "/AppImages/ios/60.png",
          revision: "317fb08c0151927246573b009a6d89bb",
        },
        {
          url: "/AppImages/ios/64.png",
          revision: "0f8186c0775b2a784c38787366a32f82",
        },
        {
          url: "/AppImages/ios/72.png",
          revision: "6fa76dddc7f8dd7142fcc2637c4b31cb",
        },
        {
          url: "/AppImages/ios/76.png",
          revision: "79ffba6cc950da520fbb571681f1134d",
        },
        {
          url: "/AppImages/ios/80.png",
          revision: "b737d6e84d30cf5a8c6c978ba3c82d7d",
        },
        {
          url: "/AppImages/ios/87.png",
          revision: "0499a7583f154aef5412c3865c6ce4b7",
        },
        {
          url: "/AppImages/windows11/LargeTile.scale-100.png",
          revision: "05ce6e0de980ccd853005b3ddb1f1bcf",
        },
        {
          url: "/AppImages/windows11/LargeTile.scale-125.png",
          revision: "7d30f1e77faab67780cea988074e3ae4",
        },
        {
          url: "/AppImages/windows11/LargeTile.scale-150.png",
          revision: "77e566370f9ac8c8519d784d7dfa9d3c",
        },
        {
          url: "/AppImages/windows11/LargeTile.scale-200.png",
          revision: "f94f0c51629aaf8baa8766bce57d58c7",
        },
        {
          url: "/AppImages/windows11/LargeTile.scale-400.png",
          revision: "69364eeaa5af281a32be990c05349de2",
        },
        {
          url: "/AppImages/windows11/SmallTile.scale-100.png",
          revision: "56bc0dfcaf34e0f00d1156fd010e3e8e",
        },
        {
          url: "/AppImages/windows11/SmallTile.scale-125.png",
          revision: "88373b05ddab950c3d7cdf97381299a4",
        },
        {
          url: "/AppImages/windows11/SmallTile.scale-150.png",
          revision: "68e7b629953590ae29aa83fcdacdbf86",
        },
        {
          url: "/AppImages/windows11/SmallTile.scale-200.png",
          revision: "f13c4bc154f7afc7d493b55c69c8d8e0",
        },
        {
          url: "/AppImages/windows11/SmallTile.scale-400.png",
          revision: "9122d22dd604a75d1e0c968ba154e258",
        },
        {
          url: "/AppImages/windows11/SplashScreen.scale-100.png",
          revision: "9c0926ef9d8e8979f0254204ee7987eb",
        },
        {
          url: "/AppImages/windows11/SplashScreen.scale-125.png",
          revision: "a7208495daca1b42586ab40593edb3e8",
        },
        {
          url: "/AppImages/windows11/SplashScreen.scale-150.png",
          revision: "c36a16268bb0c92c985b7e68298fa9aa",
        },
        {
          url: "/AppImages/windows11/SplashScreen.scale-200.png",
          revision: "368bebc76e028af1d114f5f9211987db",
        },
        {
          url: "/AppImages/windows11/SplashScreen.scale-400.png",
          revision: "5eb702deba5abde7f1e288e02a8b05c6",
        },
        {
          url: "/AppImages/windows11/Square150x150Logo.scale-100.png",
          revision: "7e5fc41e86b0c9c7701b2b8e5b43826d",
        },
        {
          url: "/AppImages/windows11/Square150x150Logo.scale-125.png",
          revision: "f5e18ef1f9d86bb91a645520253e3557",
        },
        {
          url: "/AppImages/windows11/Square150x150Logo.scale-150.png",
          revision: "a64ba718d338862bb570c83b99c7940c",
        },
        {
          url: "/AppImages/windows11/Square150x150Logo.scale-200.png",
          revision: "0f09bdc8d63b904b5a98e26074b87dcd",
        },
        {
          url: "/AppImages/windows11/Square150x150Logo.scale-400.png",
          revision: "cffd8e0763e488e658d5b34aa9f86f54",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.altform-lightunplated_targetsize-16.png",
          revision: "e55bda4f495a20db6cfcd82bd1720b04",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.altform-lightunplated_targetsize-20.png",
          revision: "57ef1ac48612686ee8014b92dd87a49e",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.altform-lightunplated_targetsize-24.png",
          revision: "b925e53f5d73bff1e7864e9468a00b0f",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.altform-lightunplated_targetsize-256.png",
          revision: "8033ae128a20bf02883d4b23b052bb64",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.altform-lightunplated_targetsize-30.png",
          revision: "1cf82a5b17a698bd570e8f2ee1e975cf",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.altform-lightunplated_targetsize-32.png",
          revision: "f402df547dfde85f4bf4e1a98e4c9765",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.altform-lightunplated_targetsize-36.png",
          revision: "ece036f4722125c335a6207f592c7a60",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.altform-lightunplated_targetsize-40.png",
          revision: "4da8c44910f45ffb84b777923015e64a",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.altform-lightunplated_targetsize-44.png",
          revision: "c01f98304276de716502d81a06671474",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.altform-lightunplated_targetsize-48.png",
          revision: "1b2d4391ad5e94e1e1956eab3a9c571b",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.altform-lightunplated_targetsize-60.png",
          revision: "e7dcb1c4c38b61a28739955c1c9c33f6",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.altform-lightunplated_targetsize-64.png",
          revision: "023fc5480d84d9551df884ab93eda173",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.altform-lightunplated_targetsize-72.png",
          revision: "27c2e2847ac014e27aa261dce2ca4dc9",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.altform-lightunplated_targetsize-80.png",
          revision: "85a20075f044c0942901fc17778e456a",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.altform-lightunplated_targetsize-96.png",
          revision: "00b94e24c5dbc3ba890c0971c9092b8e",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.altform-unplated_targetsize-16.png",
          revision: "e55bda4f495a20db6cfcd82bd1720b04",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.altform-unplated_targetsize-20.png",
          revision: "57ef1ac48612686ee8014b92dd87a49e",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.altform-unplated_targetsize-24.png",
          revision: "b925e53f5d73bff1e7864e9468a00b0f",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.altform-unplated_targetsize-256.png",
          revision: "8033ae128a20bf02883d4b23b052bb64",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.altform-unplated_targetsize-30.png",
          revision: "1cf82a5b17a698bd570e8f2ee1e975cf",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.altform-unplated_targetsize-32.png",
          revision: "f402df547dfde85f4bf4e1a98e4c9765",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.altform-unplated_targetsize-36.png",
          revision: "ece036f4722125c335a6207f592c7a60",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.altform-unplated_targetsize-40.png",
          revision: "4da8c44910f45ffb84b777923015e64a",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.altform-unplated_targetsize-44.png",
          revision: "c01f98304276de716502d81a06671474",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.altform-unplated_targetsize-48.png",
          revision: "1b2d4391ad5e94e1e1956eab3a9c571b",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.altform-unplated_targetsize-60.png",
          revision: "e7dcb1c4c38b61a28739955c1c9c33f6",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.altform-unplated_targetsize-64.png",
          revision: "023fc5480d84d9551df884ab93eda173",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.altform-unplated_targetsize-72.png",
          revision: "27c2e2847ac014e27aa261dce2ca4dc9",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.altform-unplated_targetsize-80.png",
          revision: "85a20075f044c0942901fc17778e456a",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.altform-unplated_targetsize-96.png",
          revision: "00b94e24c5dbc3ba890c0971c9092b8e",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.scale-100.png",
          revision: "c01f98304276de716502d81a06671474",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.scale-125.png",
          revision: "1dd3682d0fdd090ec5b68f07729a7c56",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.scale-150.png",
          revision: "0149a999c5b146ffcba3ecf1fe500741",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.scale-200.png",
          revision: "5d7f625a7c14074755ef0eb8a31559de",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.scale-400.png",
          revision: "4b926b73457b88b39a3a78df2dc34349",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.targetsize-16.png",
          revision: "e55bda4f495a20db6cfcd82bd1720b04",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.targetsize-20.png",
          revision: "57ef1ac48612686ee8014b92dd87a49e",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.targetsize-24.png",
          revision: "b925e53f5d73bff1e7864e9468a00b0f",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.targetsize-256.png",
          revision: "8033ae128a20bf02883d4b23b052bb64",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.targetsize-30.png",
          revision: "1cf82a5b17a698bd570e8f2ee1e975cf",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.targetsize-32.png",
          revision: "f402df547dfde85f4bf4e1a98e4c9765",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.targetsize-36.png",
          revision: "ece036f4722125c335a6207f592c7a60",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.targetsize-40.png",
          revision: "4da8c44910f45ffb84b777923015e64a",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.targetsize-44.png",
          revision: "c01f98304276de716502d81a06671474",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.targetsize-48.png",
          revision: "1b2d4391ad5e94e1e1956eab3a9c571b",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.targetsize-60.png",
          revision: "e7dcb1c4c38b61a28739955c1c9c33f6",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.targetsize-64.png",
          revision: "023fc5480d84d9551df884ab93eda173",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.targetsize-72.png",
          revision: "27c2e2847ac014e27aa261dce2ca4dc9",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.targetsize-80.png",
          revision: "85a20075f044c0942901fc17778e456a",
        },
        {
          url: "/AppImages/windows11/Square44x44Logo.targetsize-96.png",
          revision: "00b94e24c5dbc3ba890c0971c9092b8e",
        },
        {
          url: "/AppImages/windows11/StoreLogo.scale-100.png",
          revision: "262e0706a0126c84f1e549f13ba12c98",
        },
        {
          url: "/AppImages/windows11/StoreLogo.scale-125.png",
          revision: "9cc746fbf5975e854b671a1e48e6b4d5",
        },
        {
          url: "/AppImages/windows11/StoreLogo.scale-150.png",
          revision: "1b603f29a22d436a5856d92b233cdee5",
        },
        {
          url: "/AppImages/windows11/StoreLogo.scale-200.png",
          revision: "36ab1fe37ce282da1dc8a821535b3474",
        },
        {
          url: "/AppImages/windows11/StoreLogo.scale-400.png",
          revision: "1992082c6218316423c37f8b17e125b4",
        },
        {
          url: "/AppImages/windows11/Wide310x150Logo.scale-100.png",
          revision: "cc50e29621db0ec53b74b1041de615a4",
        },
        {
          url: "/AppImages/windows11/Wide310x150Logo.scale-125.png",
          revision: "8047cc191b8d793035d47998e1ffcaf3",
        },
        {
          url: "/AppImages/windows11/Wide310x150Logo.scale-150.png",
          revision: "9ad52db596514ed86ebaf036b16b5afc",
        },
        {
          url: "/AppImages/windows11/Wide310x150Logo.scale-200.png",
          revision: "9c0926ef9d8e8979f0254204ee7987eb",
        },
        {
          url: "/AppImages/windows11/Wide310x150Logo.scale-400.png",
          revision: "368bebc76e028af1d114f5f9211987db",
        },
        {
          url: "/_next/static/1l3Ft1cqOnPX4hEERcj3W/_buildManifest.js",
          revision: "b6778f13f4f3d038d4353cc6b6352a1f",
        },
        {
          url: "/_next/static/1l3Ft1cqOnPX4hEERcj3W/_ssgManifest.js",
          revision: "b6652df95db52feb4daf4eca35380933",
        },
        {
          url: "/_next/static/chunks/1126-76f33385e13f006a.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/1644.3ce3adfd1deaba92.js",
          revision: "3ce3adfd1deaba92",
        },
        {
          url: "/_next/static/chunks/1727.2e779cfff5c5bdbc.js",
          revision: "2e779cfff5c5bdbc",
        },
        {
          url: "/_next/static/chunks/1749-23e3ee4d903c4567.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/2237.b155c584548c3412.js",
          revision: "b155c584548c3412",
        },
        {
          url: "/_next/static/chunks/2331-4435c715dae181b0.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/2465.75d1d3dd0b9eaa71.js",
          revision: "75d1d3dd0b9eaa71",
        },
        {
          url: "/_next/static/chunks/261-5f9607e1edfc956f.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/2661.cf87a56cb21b3651.js",
          revision: "cf87a56cb21b3651",
        },
        {
          url: "/_next/static/chunks/2689.8fbb853d238bc0c1.js",
          revision: "8fbb853d238bc0c1",
        },
        {
          url: "/_next/static/chunks/2789-0ed9a01ce519a157.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/2896-7fb23d40c848e073.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/2936-7fb53c3ad44f9085.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/295.0a8b82e18a2e7d8a.js",
          revision: "0a8b82e18a2e7d8a",
        },
        {
          url: "/_next/static/chunks/2955.06c6b229c4213908.js",
          revision: "06c6b229c4213908",
        },
        {
          url: "/_next/static/chunks/2995.f02d936ec8be6649.js",
          revision: "f02d936ec8be6649",
        },
        {
          url: "/_next/static/chunks/3357-35f1918ea3159cff.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/3449.5fd3d089c978b9bb.js",
          revision: "5fd3d089c978b9bb",
        },
        {
          url: "/_next/static/chunks/3594.9cb0c7fae07aa6c4.js",
          revision: "9cb0c7fae07aa6c4",
        },
        {
          url: "/_next/static/chunks/3727.7de6fd96eeb5a209.js",
          revision: "7de6fd96eeb5a209",
        },
        {
          url: "/_next/static/chunks/3750.891fc4ec2e263c40.js",
          revision: "891fc4ec2e263c40",
        },
        {
          url: "/_next/static/chunks/3807-1bc07d5071e30698.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/3920.308a472e1ca860bc.js",
          revision: "308a472e1ca860bc",
        },
        {
          url: "/_next/static/chunks/3952.544c5c9b20ed1f99.js",
          revision: "544c5c9b20ed1f99",
        },
        {
          url: "/_next/static/chunks/3966.47d178f19931c2a5.js",
          revision: "47d178f19931c2a5",
        },
        {
          url: "/_next/static/chunks/4827.c45f62d907231c2b.js",
          revision: "c45f62d907231c2b",
        },
        {
          url: "/_next/static/chunks/4858.9c713d3277c96cf1.js",
          revision: "9c713d3277c96cf1",
        },
        {
          url: "/_next/static/chunks/5053-c40e2f10746f98cb.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/5054.d995f7d076b65933.js",
          revision: "d995f7d076b65933",
        },
        {
          url: "/_next/static/chunks/5250-a3ecf40283f5fa77.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/5289-1937118f67f859ef.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/53c13509-b04747c29d73a6f2.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/5468-fe7c1444aab69655.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/5535-19ed81854911bf5a.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/5718.41086edf7050f5af.js",
          revision: "41086edf7050f5af",
        },
        {
          url: "/_next/static/chunks/5d0d0575.a96e5ebb1504a10a.js",
          revision: "a96e5ebb1504a10a",
        },
        {
          url: "/_next/static/chunks/6202.f255e8e191292423.js",
          revision: "f255e8e191292423",
        },
        {
          url: "/_next/static/chunks/6288-6b940c1364b7f634.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/6733.fd793b811785c7d3.js",
          revision: "fd793b811785c7d3",
        },
        {
          url: "/_next/static/chunks/69b09407-9e06e9a6911dcc1e.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/7101-905fa06faeea1341.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/7180.2b9c3b86553c5bb0.js",
          revision: "2b9c3b86553c5bb0",
        },
        {
          url: "/_next/static/chunks/72fdc299.c6b0ccacd688220a.js",
          revision: "c6b0ccacd688220a",
        },
        {
          url: "/_next/static/chunks/7381.01cdc9d6f62e727b.js",
          revision: "01cdc9d6f62e727b",
        },
        {
          url: "/_next/static/chunks/7717-e06d5609ac212dfd.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/8024-422fb2d948966538.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/85.6068d6736e093c35.js",
          revision: "6068d6736e093c35",
        },
        {
          url: "/_next/static/chunks/8817.e680484e833fe215.js",
          revision: "e680484e833fe215",
        },
        {
          url: "/_next/static/chunks/8932.da60a1a75ba9f1a7.js",
          revision: "da60a1a75ba9f1a7",
        },
        {
          url: "/_next/static/chunks/905.2dd6573012022841.js",
          revision: "2dd6573012022841",
        },
        {
          url: "/_next/static/chunks/913-0a95b5d9b95e7858.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/9202-af5aba27309d5e89.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/9206.7756329f8482c5ff.js",
          revision: "7756329f8482c5ff",
        },
        {
          url: "/_next/static/chunks/9417.f269c02b48ab110d.js",
          revision: "f269c02b48ab110d",
        },
        {
          url: "/_next/static/chunks/9453-0dd1a81f43fcacf9.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/9484-4cbafbcebad407c4.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/9496.1ad4a99cac29e254.js",
          revision: "1ad4a99cac29e254",
        },
        {
          url: "/_next/static/chunks/966-8b830a1b1dd32614.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/96c2883b.8da4b1a3b5cc735e.js",
          revision: "8da4b1a3b5cc735e",
        },
        {
          url: "/_next/static/chunks/9837-fe14d042c4d6086c.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(home)/consulting/page-b8527eae0b5abb20.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(home)/seo-agency/page-0e7543d99283235c.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(pages)/about/page-9cd58938c2a62a68.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(pages)/admin/emails/create-account/page-f7c6b89f076439aa.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(pages)/contact/page-b6686ada147e4761.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(pages)/onboarding/verify-email/page-9e49077c368bae32.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(pages)/pricing/page-ca5f1ae9c32f5425.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(pages)/profile/page-b7be75512fe1df9a.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(pages)/services/page-d627fe81bf48ee52.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/@loginDialogue/(.)login/page-bb318b1816b65c1f.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/@loginDialogue/default-1fa93c033422abf4.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/@loginDialogue/error-e954fdb8db7d5d7a.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/avatar/page-11c1d3ad689a608d.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/layout-4d290130751720b7.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/login/page-fd4ceeb6e1010104.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/not-found-25cc48bb8d2537a7.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/page-dbdea7a6ca30539c.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/posts/%5Bslug%5D/error-4e8f3b0a2255e64a.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/posts/%5Bslug%5D/page-01b5c5fdb84fdf59.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/posts/loading-4f63a2c39432635c.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/posts/page-865c184e69894282.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/projects/%5Bslug%5D/error-742a75ca80cc2e19.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/projects/%5Bslug%5D/page-290f8cb6b318a323.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/projects/loading-73e3a2363ba8f125.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/projects/page-5cd0bc63d5b461b9.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/register/page-3a0a2aa595e4bc18.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/search/%5BsearchTerm%5D/loading-997c08ca433e2643.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/search/%5BsearchTerm%5D/page-82db7a1a7b5118de.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/app/error-0c52c69899596b0b.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/app/layout-fe01aedcf86a425e.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/app/not-found-86ebfdced9801677.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/be90980d-487651a4e78f6ffa.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/fd9d1056-24d841a0dc572afe.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/framework-2337817e7689d45a.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/main-app-891948e707a529cc.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/main-c1f2d4eceecf19b1.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/pages/_app-57bdff7978360b1c.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/pages/_error-29037c284dd0eec6.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/pages/docs-9fcaa1eb9a513150.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/pages/docs/erd-2e9317fd5d3845e9.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/pages/docs/readme-f2ca4df75e55a6a0.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/chunks/polyfills-c67a75d1b6f99dc8.js",
          revision: "837c0df77fd5009c9e46d446188ecfd0",
        },
        {
          url: "/_next/static/chunks/webpack-00f690b928b499a1.js",
          revision: "1l3Ft1cqOnPX4hEERcj3W",
        },
        {
          url: "/_next/static/css/0a65b4203b1af98c.css",
          revision: "0a65b4203b1af98c",
        },
        {
          url: "/_next/static/css/2aa199ae6265e4c0.css",
          revision: "2aa199ae6265e4c0",
        },
        {
          url: "/_next/static/css/3704284d62e9aeb7.css",
          revision: "3704284d62e9aeb7",
        },
        {
          url: "/_next/static/css/3fea2f5c39d1f458.css",
          revision: "3fea2f5c39d1f458",
        },
        {
          url: "/_next/static/css/54fde772ad89017e.css",
          revision: "54fde772ad89017e",
        },
        {
          url: "/_next/static/css/67325112eae0ec02.css",
          revision: "67325112eae0ec02",
        },
        {
          url: "/_next/static/css/960c3ae130cfde0e.css",
          revision: "960c3ae130cfde0e",
        },
        {
          url: "/_next/static/media/0e4fe491bf84089c-s.p.woff2",
          revision: "5e22a46c04d947a36ea0cad07afcc9e1",
        },
        {
          url: "/_next/static/media/1c57ca6f5208a29b-s.woff2",
          revision: "491a7a9678c3cfd4f86c092c68480f23",
        },
        {
          url: "/_next/static/media/3dbd163d3bb09d47-s.woff2",
          revision: "93dcb0c222437699e9dd591d8b5a6b85",
        },
        {
          url: "/_next/static/media/42d52f46a26971a3-s.woff2",
          revision: "b44d0dd122f9146504d444f290252d88",
        },
        {
          url: "/_next/static/media/5647e4c23315a2d2-s.woff2",
          revision: "e64969a373d0acf2586d1fd4224abb90",
        },
        {
          url: "/_next/static/media/627622453ef56b0d-s.p.woff2",
          revision: "e7df3d0942815909add8f9d0c40d00d9",
        },
        {
          url: "/_next/static/media/7be645d133f3ee22-s.woff2",
          revision: "3ba6fb27a0ea92c2f1513add6dbddf37",
        },
        {
          url: "/_next/static/media/7c53f7419436e04b-s.woff2",
          revision: "fd4ff709e3581e3f62e40e90260a1ad7",
        },
        {
          url: "/_next/static/media/8fb72f69fba4e3d2-s.woff2",
          revision: "7a2e2eae214e49b4333030f789100720",
        },
        {
          url: "/_next/static/media/912a9cfe43c928d9-s.woff2",
          revision: "376ffe2ca0b038d08d5e582ec13a310f",
        },
        {
          url: "/_next/static/media/934c4b7cb736f2a3-s.p.woff2",
          revision: "1f6d3cf6d38f25d83d95f5a800b8cac3",
        },
        {
          url: "/_next/static/media/a5b77b63ef20339c-s.woff2",
          revision: "96e992d510ed36aa573ab75df8698b42",
        },
        {
          url: "/_next/static/media/a6d330d7873e7320-s.woff2",
          revision: "f7ec4e2d6c9f82076c56a871d1d23a2d",
        },
        {
          url: "/_next/static/media/baf12dd90520ae41-s.woff2",
          revision: "8096f9b1a15c26638179b6c9499ff260",
        },
        {
          url: "/_next/static/media/bbdb6f0234009aba-s.woff2",
          revision: "5756151c819325914806c6be65088b13",
        },
        {
          url: "/_next/static/media/cff529cd86cc0276-s.woff2",
          revision: "c2b2c28b98016afb2cb7e029c23f1f9f",
        },
        {
          url: "/_next/static/media/d117eea74e01de14-s.woff2",
          revision: "4d1e5298f2c7e19ba39a6ac8d88e91bd",
        },
        {
          url: "/_next/static/media/dfa8b99978df7bbc-s.woff2",
          revision: "7a500aa24dccfcf0cc60f781072614f5",
        },
        {
          url: "/_next/static/media/e25729ca87cc7df9-s.woff2",
          revision: "9a74bbc5f0d651f8f5b6df4fb3c5c755",
        },
        {
          url: "/_next/static/media/eb52b768f62eeeb4-s.woff2",
          revision: "90687dc5a4b6b6271c9f1c1d4986ca10",
        },
        {
          url: "/_next/static/media/f06116e890b3dadb-s.woff2",
          revision: "2855f7c90916c37fe4e6bd36205a26a8",
        },
        {
          url: "/benefits_img_1.jpg",
          revision: "81bf81927805eac9f44fe5f1de5eda2d",
        },
        {
          url: "/benefits_img_2.jpg",
          revision: "75e9e5b97ccbd5555ae837cdfbab89e2",
        },
        {
          url: "/certificates/margin_certificate_1.png",
          revision: "a3ab633de3ed1f6c17dcd28f5db36288",
        },
        {
          url: "/certificates/margin_certificate_2.png",
          revision: "584be4bb81c28ad5f655822fd3ea78a7",
        },
        {
          url: "/certificates/margin_certificate_3.png",
          revision: "1f1c4bab67046ce7b2cbd1ea33a22832",
        },
        {
          url: "/certificates/margin_certificate_4.png",
          revision: "86e97aca6b9542c585885b707e509f4a",
        },
        {
          url: "/certificates/margin_certificate_5.png",
          revision: "fa25321f9e32ff1d91db85c0dce7bb03",
        },
        {
          url: "/certificates/margin_certificate_6.png",
          revision: "00ca08e687e5d951778880e7f77a65d8",
        },
        {
          url: "/certificates/margin_partner_1.png",
          revision: "f1653e6c4ffc56bde9bc24c02b5d77c5",
        },
        {
          url: "/certificates/margin_partner_2.png",
          revision: "37bff83434c87b6dc056e9fdda1aaaee",
        },
        {
          url: "/certificates/margin_partner_3.png",
          revision: "c4d43518fba8ff57ea8a5a250b36409d",
        },
        {
          url: "/certificates/margin_partner_4.png",
          revision: "cda62bd93e4441c2244b9d5bbba06af8",
        },
        {
          url: "/certificates/margin_partner_5.png",
          revision: "720f3f8fb03b160fe249aac343f70e3b",
        },
        {
          url: "/certificates/margin_partner_6.png",
          revision: "fa576966dc7a41b1be7f8b26a8911249",
        },
        { url: "/changelog.txt", revision: "a8f050591ac28159dc32f6d75dfb9635" },
        {
          url: "/circles_pattern.png",
          revision: "0fca4c3a3bee6ae16c8c7be97a5541f2",
        },
        {
          url: "/circles_pattern_2.png",
          revision: "c46eb9aeb8f45985063d36508e7bb66a",
        },
        { url: "/erd/ERD.md", revision: "443fb500bf03f72746d596b61b60e210" },
        { url: "/faq.jpg", revision: "032337d51e8863bb3d311397621f79a5" },
        {
          url: "/furious5/img (1).JPG",
          revision: "d8b55141043d6688dabfcb272f24af38",
        },
        {
          url: "/furious5/img (2).JPG",
          revision: "e1b2ec3a6ac684936b3b800e9c640fbb",
        },
        {
          url: "/furious5/img (3).JPG",
          revision: "5f4264d4cbe0d251976b02b6d30ec685",
        },
        {
          url: "/furious5/img (4).JPG",
          revision: "b20555c1541ea73703137acf8f109db6",
        },
        {
          url: "/furious5/img (5).JPG",
          revision: "c55b2ddd48505a556a03f6ed1aa20148",
        },
        {
          url: "/happy_customers.png",
          revision: "7ea2fc9a010bd28621a3cfa330787b46",
        },
        { url: "/headset.svg", revision: "7a3fd52a494a7118e509c07b1ef44f83" },
        {
          url: "/hero/consulting_hero.png",
          revision: "f8635725267fd4cdcee12c87823ebcad",
        },
        {
          url: "/hero/gradient_creative.png",
          revision: "edc70a1c83d6a3a64f35ffcb66b9f548",
        },
        {
          url: "/hero/gradient_creative_dark.png",
          revision: "e192f30d64dd6a1f66a7ecccb540cd38",
        },
        { url: "/hero/hero.jpg", revision: "82086c30654f2b5eb65261f1a0f8364f" },
        {
          url: "/hero/margin_home_2_hero-min.jpg",
          revision: "0e6c1c55400da5d1fd5fe8127132f37c",
        },
        {
          url: "/icons/24h-support-4914_c60ea668-79af-415e-96ff-fabedf4d86fd.svg",
          revision: "8fd4290bbbf5dc4ac37bd41828be4726",
        },
        {
          url: "/icons/add-1_17fe7692-7547-4517-bda9-eea94283ecf2.svg",
          revision: "42a26f1f1401690ec078c85c36cb5c46",
        },
        {
          url: "/icons/add-user-3030_e2ab10fe-377b-48b8-bc0f-4ea938b8ab7a.svg",
          revision: "f7ef658d27100648c8251e23d8e7d90d",
        },
        {
          url: "/icons/add-woman-user-3045_76fcddeb-9689-448e-b37a-6a39a953ed1e.svg",
          revision: "ce12fbc414cb4841a9f3fc1fd290936e",
        },
        {
          url: "/icons/address-book-4906_838cc7c2-c442-4ef7-87a0-9fcb6cb8af7d.svg",
          revision: "d22f99f67b2f18a79cc53e5539ee7c2a",
        },
        {
          url: "/icons/alarm-clock-5918_de645ca2-52f6-4b88-b314-2902f4dd73c6.svg",
          revision: "2ec74563f9cfa35fd481683f3a17463c",
        },
        {
          url: "/icons/angle-down-6_cfaeac61-cf13-4330-8278-6da11bc00b09.svg",
          revision: "2c8151a569faf9a47beef1290a06f2f5",
        },
        {
          url: "/icons/angle-left-8_78da551a-8688-498b-b646-6740b326d9e9.svg",
          revision: "4b41f0d46772b0b2a7eaef09fbf67a99",
        },
        {
          url: "/icons/angle-right-9_109f3459-8b5f-436f-91b8-9c0ab4cd2b00.svg",
          revision: "7a929a7b2796fae327e489705fe698f2",
        },
        {
          url: "/icons/angle-up-7_517d8dea-f6df-44fb-a491-84907ad57763.svg",
          revision: "b913dd160ed61c277c9ab97a0b3ddf59",
        },
        {
          url: "/icons/arrow-target-1699_2ce3efe1-b89f-492e-ae89-130bde2efe86.svg",
          revision: "6dd94cec52f11538f83951a4de1f6b15",
        },
        {
          url: "/icons/at-sign-4961_b79645bd-379a-4491-8d9c-e497d4bee7bb.svg",
          revision: "998bb11e9610f375cdb0f92c197411c3",
        },
        {
          url: "/icons/bank-cards-2628_80054d06-79f2-4020-83c7-51c14a8dd6f4.svg",
          revision: "be015393563646dbb319851e1864f01a",
        },
        {
          url: "/icons/bank-check-2645_1c364f72-597f-4846-a9d7-ee291a9bb844.svg",
          revision: "ee777f8431b7980c5375101a89ff53cf",
        },
        {
          url: "/icons/binocular-1694_e78724bc-c396-4b40-819f-ae868b0533d2.svg",
          revision: "737ccea6b16b94c03adfc68a4710380a",
        },
        {
          url: "/icons/bitcoin-sign-2615_f2434478-89ca-4840-b58f-5e3030db8acb.svg",
          revision: "aee9cd41a175cc960cef0dcf2cf37a0e",
        },
        {
          url: "/icons/bookmark-archive-4247_a9dcfc6c-2cfa-4816-b5dc-8a7ae2440252.svg",
          revision: "e216f70e5605ce6358416af9da476838",
        },
        {
          url: "/icons/briefcase-2594_3496475c-af8b-499b-811c-b14f3171b60f.svg",
          revision: "8a982a0efc9da6dcadfdecc8c3881c2c",
        },
        {
          url: "/icons/british-pound-sign-2608_25c63064-86fa-4cb7-b25a-d5d37c328355.svg",
          revision: "807ea14debad6b70cccd74ef63526075",
        },
        {
          url: "/icons/burst-mode-5277_826b1e81-860a-4728-8d8d-db1de30c5532.svg",
          revision: "65e2caeeadf16873c508a1c8b6721fec",
        },
        {
          url: "/icons/business-report-2684_46869d41-949b-40e5-ae1a-a3a08b228ee8.svg",
          revision: "737f7595d31e11c553cd8a9dcd8427c8",
        },
        {
          url: "/icons/calculator-2622_c1438ea1-2c39-4627-8cb0-f70fdb9a82b7.svg",
          revision: "252baf051fd03dd3017320f385c71f20",
        },
        {
          url: "/icons/call-contact-3043_7e0778d6-4e43-426d-9077-079037296fa5.svg",
          revision: "da3bcd2b19eba4b8b07c1a408f433fde",
        },
        {
          url: "/icons/championship-3148_4d1ae398-d2dc-4dad-8856-976fe4c93719.svg",
          revision: "77f84468573938ada9f67c5e235cb6bb",
        },
        {
          url: "/icons/chart-2694_7b27958f-0144-496b-b5e7-fd56bd5ee6bb.svg",
          revision: "fdd7d39980d3e84dcb03e753d650a76e",
        },
        {
          url: "/icons/chart-4177_e9c2b612-aa7f-4767-a5ce-f6184dce8b59.svg",
          revision: "61799c21412b4e413ded574cb85145f6",
        },
        {
          url: "/icons/chat-4972_0550a4fd-3603-4b89-8325-dd026f494984.svg",
          revision: "90150b223f0aa84ae892360f0d9eb288",
        },
        {
          url: "/icons/checked-database-2132_ebb1b3a2-376e-46d1-b50a-214cb9d622d2.svg",
          revision: "6ae4f62057b7da5494d3d4c1e7229803",
        },
        {
          url: "/icons/checkmark-4_c186410f-f382-4d46-9b47-cff96a0d3622.svg",
          revision: "3ab664c818ebab3459d68cf7df176d87",
        },
        {
          url: "/icons/checkout-cart-2532_d71904aa-a1ca-4415-95b2-004d927a89d8.svg",
          revision: "61613e0dc469db8aabfef2847df1bc33",
        },
        {
          url: "/icons/close-3_d53987f7-10cc-486a-aad9-9673fb7597de.svg",
          revision: "495ef6f33013cc2e7297a6f980b62075",
        },
        {
          url: "/icons/coins-2635_bd17438e-0326-4eba-bd10-dd5f8ab74b22.svg",
          revision: "e3864a48ae0ab0837c9cddc985633978",
        },
        {
          url: "/icons/coins-2636_7b1c8ca7-cdd9-4f8c-941f-508822d15076.svg",
          revision: "e1a33c373a4c0a5b82be673123149f2f",
        },
        {
          url: "/icons/computer-network-2162_ef0fb779-b990-4dbe-b82d-005f0a4b5a88.svg",
          revision: "139274cbc34e729f252e81266ff444b1",
        },
        {
          url: "/icons/configuration-5976_6dde9742-80e8-48b7-b36f-aa23dfc6644b.svg",
          revision: "b1b5d9d79ac18fba8d4cf80f8fb82756",
        },
        {
          url: "/icons/contact-3092_2c8fb15b-1417-4f7d-bcf5-d7c64acd3799.svg",
          revision: "cdd3b9c61b2a2410e1ff8401cbdc5c43",
        },
        {
          url: "/icons/copied-to-clipboard-4216_d6c388bf-728a-4123-8238-480a27553ff7.svg",
          revision: "0c5c8b9368e1cd85b9a6800335bafb1e",
        },
        {
          url: "/icons/currency-2634_d41cd9f8-1db2-4236-b082-94568e599e40.svg",
          revision: "60f08c2707eb63a88442c2387591f712",
        },
        {
          url: "/icons/cursor-1703_bef53f13-b356-4a27-987e-a5eedb5d21e3.svg",
          revision: "cea3ea19fd3c8ca856daee696656d924",
        },
        {
          url: "/icons/customer-support-4912_a5517329-a472-47b5-8155-d507da181405.svg",
          revision: "22d08710badf0a99622f9cc53efdfcd4",
        },
        {
          url: "/icons/data-app-2057_cdd8fbaf-0caf-4a7b-9644-9004976bca94.svg",
          revision: "f321dd4b5738a72157ee9329cb72e08a",
        },
        {
          url: "/icons/deadline-5926_5778aee2-b372-4b21-94a1-c9fc06ac464c.svg",
          revision: "ced5e464b5dc34d126d784b8a7ff4cdb",
        },
        {
          url: "/icons/design-1713_f90df3c6-df94-4126-8dd1-8bf45a999470.svg",
          revision: "3e5cbc79f7f6c3a86e7246d80e0d4d7b",
        },
        {
          url: "/icons/detective-3077_24353679-c3d5-433c-83c4-9c442036b65b.svg",
          revision: "e0e994c03050e8d63ead103eaf2a32ec",
        },
        {
          url: "/icons/dollar-sign-2596_307eb9e5-1744-4e65-be9c-fa578ab924ad.svg",
          revision: "3d6fa4ecee2c8f0b6438846d0abff76c",
        },
        {
          url: "/icons/edit-document-4191_913956ad-aac3-4d29-b4ef-061756334d24.svg",
          revision: "b353598be0531ee59152853ebbd862df",
        },
        {
          url: "/icons/email-4903_43ef1b93-4cdb-442a-9557-0e5ac54a9a87.svg",
          revision: "0c1e01fffb6f33681c8f67cfee743381",
        },
        {
          url: "/icons/employee-3066_0f4d2f86-22bc-44b5-a1ef-cf29ce272fd1.svg",
          revision: "3b9594630abccb65b0a35d1281d50594",
        },
        {
          url: "/icons/entrance-2695_7b1d5401-b54d-4f14-8632-1d2d352d21fc.svg",
          revision: "b7bab4eb22e69241286c65a10afb51e6",
        },
        {
          url: "/icons/euro-sign-2600_99e9e7e2-83aa-48f9-980c-0515635bf1ec.svg",
          revision: "0e15e013ee3a6f8aa3ad7eae9c616724",
        },
        {
          url: "/icons/favorite-3138_ce4bc801-b334-4644-b5b4-187723d1e133.svg",
          revision: "292cecbf93590c5dd327f8823ab714f4",
        },
        {
          url: "/icons/fax-4908_e2aafbc3-2642-4387-b925-d927b12d46e5.svg",
          revision: "eeb317d8eb8e443fa8fdcc1d27de7199",
        },
        {
          url: "/icons/filter-data-2123_c796b771-5b22-43fd-8589-3bc443a6ffbd.svg",
          revision: "59989d8ea372fb17183e868a68f7dbad",
        },
        {
          url: "/icons/find-1633_beb26406-c05b-4504-ae76-b676f5407e9e.svg",
          revision: "6d5d5ea922245ee9376d16bcaa294c53",
        },
        {
          url: "/icons/flag-3133_d5a0be0f-a840-4fbf-b4f7-ecdcb15ff391.svg",
          revision: "04846d4176b1a0d9e59d2d6716e587a4",
        },
        {
          url: "/icons/flame-3117_03fe7f40-f677-4354-b6ce-f38169bfb7d7.svg",
          revision: "1d85e57f0cb9ef687dd0979bd0502186",
        },
        {
          url: "/icons/game-controller-2076_204c7718-10f0-4d99-8360-7bcc4ed9e67b.svg",
          revision: "6a9c2a5453ff06a62562bf28cfdc72b6",
        },
        {
          url: "/icons/giftbox-2704_ed449b82-eed3-4ce8-8196-59e12baa3d19.svg",
          revision: "3216c14c1c773bdccffe48bfa18eaca5",
        },
        {
          url: "/icons/handshake-3124_670c4553-214a-4d06-830f-4d0855736c60.svg",
          revision: "11e22b6325cce34baabd88eab0aaea09",
        },
        {
          url: "/icons/heart-3108_ff854474-1a9d-4bd7-adad-3a248efe5121.svg",
          revision: "b039b01fab76f587b1d6ed08633e8124",
        },
        {
          url: "/icons/hourglass-5928_02636187-b5dc-4f31-ae7a-f2585ec9c3e7.svg",
          revision: "7455ddfff8e03d83f95437971495f39d",
        },
        {
          url: "/icons/id-card-3089_86b05711-9699-40ff-8cc6-1fe65ce5ead3.svg",
          revision: "3078dfd36b5fdb68f1ff2679b254fa5e",
        },
        {
          url: "/icons/idea-3125_8529957d-883a-4b67-94ee-c5945c5baf8d.svg",
          revision: "9bbacc70a42a0009eedcb7f1225f4600",
        },
        {
          url: "/icons/identity-3090_8a9a5415-e900-4820-872d-790c87f3960c.svg",
          revision: "799778ed8e3c2aa51ecc62d71ca206df",
        },
        {
          url: "/icons/imac-screen-2078_36d0818d-1a8e-45af-a9be-e1147d4c4b21.svg",
          revision: "05fd077d78c947d0f614ad35f7a34b8e",
        },
        {
          url: "/icons/important-warning-387_fb92aab4-1c8d-41d0-82d9-f32c4f05f9b9.svg",
          revision: "bf35891dae8a4eb8b46ea6776a296418",
        },
        {
          url: "/icons/info-help-384_e64f4337-e230-41b6-8584-0b795f8b0b4f.svg",
          revision: "bc08085cdf91fbac60b3bb0d0f58892f",
        },
        {
          url: "/icons/ipad-2111_42f5de14-f54b-4a1b-9153-9c2ce20dbbdd.svg",
          revision: "3fee580d5f29efbd2bc07dc5f010dd66",
        },
        {
          url: "/icons/key-1677_2fdd9f6e-3f98-4084-bec4-022b22a3ef39.svg",
          revision: "5445f45b857f7aee4647d69928acb366",
        },
        {
          url: "/icons/king-3080_ff0ead35-60cc-4473-9bf4-9d0140547345.svg",
          revision: "a74ac9648a1161db05d2482af02d3666",
        },
        {
          url: "/icons/label-2701_c39b79b7-a3a6-47fb-83cf-602737aa2f69.svg",
          revision: "93cf73f10d31367023586d0a4c08897b",
        },
        {
          url: "/icons/label-tag-2698_aa0c2baf-6fd2-4033-b0cc-e83b1e43d58b.svg",
          revision: "0cdf2a22e50f70d41894370789854655",
        },
        {
          url: "/icons/lady-3069_d9aef35c-250e-41f2-85a5-212e3a5079a1.svg",
          revision: "dd442969d25ee456cb1f256eea680def",
        },
        {
          url: "/icons/law-2648_63c4b14a-f304-4983-af2c-1c294d7b7cc2.svg",
          revision: "d75f8c1c299e6d16e143331aaf723464",
        },
        {
          url: "/icons/lightning-bolt-1701_b5ee843d-ef15-49cf-aa8c-92d063befb3d.svg",
          revision: "9530f7d8d5de6245dd88bcb1ab871172",
        },
        {
          url: "/icons/like-3109_53e3759d-e217-4065-9870-fe5df0d71abd.svg",
          revision: "53bbbcef6ccdd77a6a6eb3f8c069b7b0",
        },
        {
          url: "/icons/like-3109_e3892680-e584-4947-997b-55b1cbbff217.svg",
          revision: "53bbbcef6ccdd77a6a6eb3f8c069b7b0",
        },
        {
          url: "/icons/like-hand-3122_e7359fcd-974d-4499-ae1f-d1580a73a495.svg",
          revision: "64fb3f9639af48f43079bd597c5b94f9",
        },
        {
          url: "/icons/lol-emoji-3100_d0be0b8d-099d-49e6-b382-b7abf98b5f6c.svg",
          revision: "97e49f9b720fbbb00e755a8a99143c0b",
        },
        {
          url: "/icons/luxury-3119_9493066b-ae38-46c7-a0e5-c4d0460c2bf0.svg",
          revision: "b98eec0d3839315a5610b4c59f6ff80e",
        },
        {
          url: "/icons/mail-4938_26918dfa-71f0-43df-839f-0c61cb20b608.svg",
          revision: "6b8a156a259c79eba4f6a884fa6a0e13",
        },
        {
          url: "/icons/man-3021_32e7bd28-565a-4231-a86d-e151573926e0.svg",
          revision: "6e70b82e4691981d262c31e8e64dc46c",
        },
        {
          url: "/icons/map-marker-843_0c1db6e9-fa05-4728-9b6a-33087202e432.svg",
          revision: "0cb5ca7912e1317cbdaf5fe0f4e315a3",
        },
        {
          url: "/icons/medal-3141_6860a6ec-597a-49e1-a5d2-dd4b070acef3.svg",
          revision: "c9ce1bfd026d9ea5109cde33a1aa8fe6",
        },
        {
          url: "/icons/medical-research-6506_05214fe4-cb2e-4171-ac03-72168bf2981b.svg",
          revision: "31738df22d39066b3216ef09e5fe1010",
        },
        {
          url: "/icons/megaphone-4923_2b1baa3e-826f-49fd-b786-4859c665686a.svg",
          revision: "de0f53bdab01c990cf8275795649a0fa",
        },
        {
          url: "/icons/message-app-4901_a41c58f7-50ee-4ec8-80dc-df12e6086ced.svg",
          revision: "fb43d90ed5e39ee21f9d0e998f638832",
        },
        {
          url: "/icons/minus-2_878006e7-5ca4-498a-a127-b59ee93bfd5c.svg",
          revision: "6775f509ef2c6f3cf8c2f0092a7d667a",
        },
        {
          url: "/icons/money-2642_7ed2f846-9963-4790-907b-a517b568efb6.svg",
          revision: "9fe0dfbe592b1deae627963b8503e1ea",
        },
        {
          url: "/icons/money-bag-2637_bd038e59-9e59-4b2b-8eb4-5345d09cad3c.svg",
          revision: "727a5dc040b16ab01f7a894f130b9729",
        },
        {
          url: "/icons/money-bag-bitcoin-2641_b3d94b14-5fcd-4fb3-bd1d-359daeec5f87.svg",
          revision: "219db788ec85d49af4e6ff859b03775a",
        },
        {
          url: "/icons/money-bag-euro-2638_7a6fc063-3fe5-4ebe-b042-fcdac5c8ccbf.svg",
          revision: "ac2c12e8423c0c0f3e8c390c2ab0b48c",
        },
        {
          url: "/icons/money-bag-pound-2640_be470841-7725-4ccd-a9ab-3e57ea4f1481.svg",
          revision: "10a6d0043c4f19737bfabda29cef91c0",
        },
        {
          url: "/icons/money-bag-yen-2639_af460bd5-5063-449d-8518-2d2ed8746855.svg",
          revision: "dc338815f37110b1ef655a49b61ce4f6",
        },
        {
          url: "/icons/money-box-2644_2bd6331e-bcfb-40c4-9b98-eeb4a3f0c83d.svg",
          revision: "9626fc3db51731f3f239b98ab564c440",
        },
        {
          url: "/icons/mouse-2098_52f14fdf-0b97-42b6-935d-c6632439291b.svg",
          revision: "2e5acd3985a1212416234a0dfa1fee4b",
        },
        {
          url: "/icons/navigation-map-899_8a633402-0181-47f3-9259-77bf9d0e13f4.svg",
          revision: "b2ace884b88967562a40d29ee1d0f527",
        },
        {
          url: "/icons/network-2161_0415fae1-75e2-47e1-8da5-06cff627152d.svg",
          revision: "fda878e96f87cae79d7b431aadf4f2e9",
        },
        {
          url: "/icons/new-sticker-2620_67ad2319-453e-4d26-914a-281edd255b27.svg",
          revision: "521e58b5f9763b3a1a66d01941fef632",
        },
        {
          url: "/icons/office-phone-4907_e961bc14-1fb9-4bfe-9dbe-093a3b6227cc.svg",
          revision: "ad530eb7ba205023738870331696ee81",
        },
        {
          url: "/icons/open-24-2545_08dfca12-5764-4edb-b207-c0c68d087bad.svg",
          revision: "00b6e33a9dd936e0ed7666d3dafa6923",
        },
        {
          url: "/icons/paper-plane-4957_5bbcc5f5-2745-43a1-8e3b-2c82d293d151.svg",
          revision: "20358da91e40e53b853e28389ed03d7d",
        },
        {
          url: "/icons/pay-2643_cf4ecaa0-bcfb-4c2b-91e1-7353cb0dccdd.svg",
          revision: "ea5a49f7626bf64dae00dab76b2d0a4c",
        },
        {
          url: "/icons/pay-by-card-2627_39075c44-df17-4e7d-8659-a5915e26d820.svg",
          revision: "2833dae59d55b3c4e458db5afb37cd9d",
        },
        {
          url: "/icons/pen-tool-1732_6cec17d5-9eb2-4fa0-ab39-33c31abb4612.svg",
          revision: "aa39ff3e5b2d7f2ea4a65b19245869a3",
        },
        {
          url: "/icons/percentage-2611_beeaaba3-5efc-4e6f-bdd5-d8bfea1e16c0.svg",
          revision: "15befce900d06873bc4e5ed5f997444d",
        },
        {
          url: "/icons/pie-chart-2693_1fb426e1-4f6e-472f-82e8-6186772e3424.svg",
          revision: "7da46d18d8de7bea0cfe20a799edd13d",
        },
        {
          url: "/icons/pin-1667_6bcbd216-fa18-4503-9046-2ee20d09eaaa.svg",
          revision: "bd96bd0b23122acd9114c962b9e83bca",
        },
        {
          url: "/icons/pin-cluster-846_5be4ba96-1e3a-4457-8815-96af3164b3ad.svg",
          revision: "2369c0b21975a3bc367867a69e4a484b",
        },
        {
          url: "/icons/play-movie-5334_09793ec2-db1e-40df-91c9-8340c5c1d53a.svg",
          revision: "09c8d240cc3f975489fdfe19e1e8ec57",
        },
        {
          url: "/icons/power-cord-2106_248ae287-2c0c-4c5d-a391-2834afe6e1cc.svg",
          revision: "2dceeb44f647cd30c16346fa1525eedb",
        },
        {
          url: "/icons/price-tag-2699_9f09912d-ebea-407c-823d-116de610512e.svg",
          revision: "c552b4a7a1557171e5c0889f058dad56",
        },
        {
          url: "/icons/priority-warning-386_05482fb6-7069-4660-8540-a2f571b92e88.svg",
          revision: "a0058240cfbc70125be16b6b1d6cce92",
        },
        {
          url: "/icons/profile-3091_3362ec33-c80f-41f5-9de5-082da6058323.svg",
          revision: "47ee681c59d7acebe37b244cbb0037f9",
        },
        {
          url: "/icons/property-5963_ee04dde4-7037-45da-8cdb-b144aa763df2.svg",
          revision: "0a79e7f5594dc203e57b9a175ba24e8d",
        },
        {
          url: "/icons/puzzle-2058_36759580-64eb-459e-bc98-511d2b9a045d.svg",
          revision: "7b9327c6d9da82747b32ad2d8ae96484",
        },
        {
          url: "/icons/question-help-385_65344368-f61a-44fb-b515-03b6b9752634.svg",
          revision: "7221ad13129bc75c1b39cebe19527a21",
        },
        {
          url: "/icons/read-email-4940_4ce74bb6-ad40-43a5-8dcd-8dfac318e435.svg",
          revision: "d1d4ab806139e3d758d11e1fbb22c5c6",
        },
        {
          url: "/icons/rocket-3434_87da25a1-4e82-4eae-a260-e4309a769543.svg",
          revision: "e00d3c9ee399964d3d32ad18724f2dcd",
        },
        {
          url: "/icons/royal-3152_ba7f1779-8da9-4bd3-9403-d9b66468c790.svg",
          revision: "0255ba8e559633f18a617b7eda581097",
        },
        {
          url: "/icons/sad-emoji-3102_694ebad2-bb39-4b91-90e9-8fbf6a48ec98.svg",
          revision: "6824b5e094f1ad763368d2cc0baad653",
        },
        {
          url: "/icons/safe-2649_dafbf7d7-8f2b-4f9a-a5fa-d5be98b2e30b.svg",
          revision: "d20ac52677786d8e9e07a3e091ac2d99",
        },
        {
          url: "/icons/sales-down-2688_f68f886b-3938-4de7-8724-0f05f21b0e9f.svg",
          revision: "c74edba5d7531d3c77b618031427a651",
        },
        {
          url: "/icons/sales-up-2687_029cba9e-7dab-4ed8-be8c-b0699720452e.svg",
          revision: "e378b857854e8180e8e877b66879269e",
        },
        {
          url: "/icons/schedule-server-2160_956d8a4a-25a5-4a63-964c-d1898a5f7488.svg",
          revision: "215ddfce2e84f3cb6d2896705b9fe439",
        },
        {
          url: "/icons/search-file-4192_31b90166-b2df-48a5-aec4-f5bde806f7c9.svg",
          revision: "aaeeaafef2e476015fd1f37918a654ed",
        },
        {
          url: "/icons/search-magnify-25_5409be55-7755-48ca-97b3-9dfab5589286.svg",
          revision: "10c479d186fd7874fe668b1a30e0375f",
        },
        {
          url: "/icons/search-server-2155_de0c5774-84ec-4a99-af61-868c188d6265.svg",
          revision: "24e73f660fdb9f9bd0ce7dace0576c07",
        },
        {
          url: "/icons/secure-payment-2626_e96dc9a2-1a2d-490b-8283-6c12a61a177e.svg",
          revision: "fee49d0baf083c4c0fdc57945d474576",
        },
        {
          url: "/icons/send-email-4959_5b361b4e-fe7d-4a7a-a8bb-c199a2a9337f.svg",
          revision: "acbf7c3aa1174de758f86470acb29899",
        },
        {
          url: "/icons/settings-4193_82d16aec-7fe2-40a9-bc8a-1aa07d085fb6.svg",
          revision: "2eb776a3343b8c68d403f0a81e572022",
        },
        {
          url: "/icons/settings-5953_0dcfbeaa-9d03-4fa2-9a8e-231c20a17e08.svg",
          revision: "fab21913a31b74036308b4666acecabf",
        },
        {
          url: "/icons/share-4936_943881f4-faed-406a-8d6f-aff297f07249.svg",
          revision: "c8ef39263ff7d91362b6a67c80f4c7d1",
        },
        {
          url: "/icons/shared-folder-4227_8b34dde9-7fad-4862-8437-3551c8dfadcc.svg",
          revision: "dd4690a059df0893f2066725cacaccae",
        },
        {
          url: "/icons/sheriff-star-3155_b18b937e-344f-4676-ad17-3aeadd3fa56e.svg",
          revision: "34c6c759711ebd4bfedaf4c3f2f13ab5",
        },
        {
          url: "/icons/shield-security-2062_b529772d-ad26-466c-a009-9e771e62835a.svg",
          revision: "48660fd1b5c20c57b5a387211ffcbf37",
        },
        {
          url: "/icons/shipping-box-2665_199b5465-66b6-4c37-8842-03ac6764305c.svg",
          revision: "cf02894ee940efbe54e7e406191ed799",
        },
        {
          url: "/icons/smartphone-4897_aa627869-d7e7-4f56-84f6-f23923d72bf4.svg",
          revision: "398470db9cf683baadb49d9d03151f8f",
        },
        {
          url: "/icons/smile-emoji-3099_f677a729-366c-4518-8778-10745f0ecc7e.svg",
          revision: "28516bf598929cc688b3ce1237bef99e",
        },
        {
          url: "/icons/social-3088_488379f6-920b-4ee7-88a7-d8fa7197474a.svg",
          revision: "44190c976df569b1a0e2c39891cafdbc",
        },
        {
          url: "/icons/software-service-2045_e40b986c-38b0-4c8f-b7a3-b5e6ce091b6a.svg",
          revision: "c58b05f773f060d7d0117d7e939b7798",
        },
        {
          url: "/icons/stack-1686_643dad14-7be6-44a1-b2a6-91859011395c.svg",
          revision: "cc8c46d1deaa87a530c13ef88a0e5aad",
        },
        {
          url: "/icons/statistic-2692_f8c53b74-7130-49de-80f8-d3b593fe3e93.svg",
          revision: "96d5d7ca17f5ccef00e68fb7aa925c76",
        },
        {
          url: "/icons/statistic-4174_6b142578-0336-4e40-99cd-efaa0f2991f0.svg",
          revision: "7eac3c87e872c96a4111b3d11afd96e4",
        },
        {
          url: "/icons/store-2706_7bccdce2-ff36-488c-ab51-5fdceb58f83d.svg",
          revision: "442e01a430b158c8f631db7e0b0ce630",
        },
        {
          url: "/icons/student-3070_fa09ffd4-d520-4d23-87bd-51127d7074cf.svg",
          revision: "c87e8168cc73ccb71a92057fb538d007",
        },
        {
          url: "/icons/sync-files-4203_24c9d75e-4a08-4df3-9293-92a305c29752.svg",
          revision: "d37a7214d14cdc9a5f4584aea35cfb78",
        },
        {
          url: "/icons/tag-2700_44027903-fe7c-4494-b3d2-7fafb18b7ae1.svg",
          revision: "3e5aa2ffc4e1383af8b7b1ec2f0a93c3",
        },
        {
          url: "/icons/telephone-operator-4911_748796d3-f718-4c8f-9d44-52fb4db0575b.svg",
          revision: "5baa42a7f1263c47c940f009f2470ff0",
        },
        {
          url: "/icons/ticket-2696_e0798f90-4c8e-48d3-8fbe-f460ea4fb0c5.svg",
          revision: "87a19c34beb96584061372c200edc82b",
        },
        {
          url: "/icons/umbrella-4621_dbd4fc5a-ba0c-41b1-bfcb-8bd6d5898400.svg",
          revision: "6a3c69d72d1c73f71ff945dcabd25143",
        },
        {
          url: "/icons/unlike-hand-3123_50b33ff9-8e26-43e2-bcc8-ed1d92c6a720.svg",
          revision: "4600914764e79b4efd29e53624e56f57",
        },
        {
          url: "/icons/url-1674_3b6e9d2f-4345-4592-84dc-326cc817d589.svg",
          revision: "c437af19eb9d9e922dc5a678fdaec0ee",
        },
        {
          url: "/icons/user-address-3044_2718bcf2-5956-4549-9008-5d843623cf42.svg",
          revision: "f3bd1be0134fdba276d72c0f36d9cdea",
        },
        {
          url: "/icons/vault-2651_746f6d9a-8799-453e-80a3-605447208027.svg",
          revision: "8d49edcd5e3c61b200a91085aa875428",
        },
        {
          url: "/icons/vibrate-phone-silent-4900_d8e5484d-e40b-402e-834c-0ae0778f3693.svg",
          revision: "399842174d48269083f048cba5a4a410",
        },
        {
          url: "/icons/video-camera-4925_8024ee3a-f960-465d-89b2-73b7fb3dc50a.svg",
          revision: "7c446d4e6176d122bf2c611c2858e674",
        },
        {
          url: "/icons/visible-1646_2803a055-ad8f-4ae4-814e-7fd89dfd7392.svg",
          revision: "d522f97384c633e443dc980374999649",
        },
        {
          url: "/icons/wallet-2662_f67eba35-3cf9-47de-b200-92d9c6d7ed97.svg",
          revision: "7a719ac4490f81c8a619d6514bcf559b",
        },
        {
          url: "/icons/watch-5927_a8006dd6-72c3-459c-a73e-f949b0bd86d5.svg",
          revision: "536cecfcc54815f93cf8ede3eeb888d4",
        },
        {
          url: "/icons/woman-3022_67b8aa02-9c70-4c2c-8d60-f525dc3dfac5.svg",
          revision: "506ad882ab2ae11c9303026526100370",
        },
        {
          url: "/image/avatar/Bandit.svg",
          revision: "b35ebb5a1611dbf838d5d261d05adbbe",
        },
        {
          url: "/image/avatar/Bear.svg",
          revision: "21490afd728388de526296160d3f07c6",
        },
        {
          url: "/image/avatar/Bella.svg",
          revision: "e6d8f914973213d7ea5e807232174b86",
        },
        {
          url: "/image/avatar/Boots.svg",
          revision: "63075cb76fdb2a87040f1d5b989cd84b",
        },
        {
          url: "/image/avatar/Cleo.svg",
          revision: "37757afc38f5e97e747ec70193b549a2",
        },
        {
          url: "/image/avatar/Dusty.svg",
          revision: "a316b271594d4a1aca45c18d16036976",
        },
        {
          url: "/image/avatar/Jack.svg",
          revision: "87d82e67a8d35c6953584f331dd6f3f8",
        },
        {
          url: "/image/avatar/Leo.svg",
          revision: "dcf031ffa36b390707e3fec692f3c630",
        },
        {
          url: "/image/avatar/Lilly.svg",
          revision: "e96d22a875bfbad82909ada091faacb1",
        },
        {
          url: "/image/avatar/Maggie.svg",
          revision: "087f715aa40291268e997c8b87d9c717",
        },
        {
          url: "/image/avatar/Mia.svg",
          revision: "dd3781cf690d082ec95202b8f1dd120d",
        },
        {
          url: "/image/avatar/Midnight.svg",
          revision: "a5e5f11654298911edf33c080df0ec02",
        },
        {
          url: "/image/avatar/Milo.svg",
          revision: "6a8fa5cc66ce87fd127dff87d4abd17b",
        },
        {
          url: "/image/avatar/Oreo.svg",
          revision: "8e7e7e5b5fde0c98aa77f678f23c15d3",
        },
        {
          url: "/image/avatar/Samantha.svg",
          revision: "a0c6f60cdd635b9681189502476f39af",
        },
        {
          url: "/image/avatar/Sasha.svg",
          revision: "cb2447d313bf9baeaa7fc221bc227066",
        },
        {
          url: "/image/avatar/Shadow.svg",
          revision: "37dc05de68db0e6f84e8e0aa5b75775d",
        },
        {
          url: "/image/avatar/Smokey.svg",
          revision: "a8e09c69ffe6ec48f18ed051fcf9e132",
        },
        {
          url: "/image/avatar/Snuggles.svg",
          revision: "14c8837718d74127e5817aca99dd13db",
        },
        {
          url: "/image/avatar/Zoey.svg",
          revision: "96c0538d231fcb2cb2956690459d7a89",
        },
        {
          url: "/image/kata.JPG",
          revision: "60869428912fab0005f71a223ae29716",
        },
        {
          url: "/image/punch.JPG",
          revision: "f439f4fd4bfb1fc5e74e5743143e6800",
        },
        { url: "/logo.png", revision: "1441639a32e4da79f65a494399bfd0fa" },
        { url: "/logo.svg", revision: "b698078b0c4122d9f02df37e7093114d" },
        { url: "/logo_dark.svg", revision: "43d78fa17598a2e84844c841b42e852b" },
        { url: "/manifest.json", revision: "9a6937aa20e795ad38da8fa5f1ab81c4" },
        {
          url: "/moneyback_badge@2x.png",
          revision: "78c6cb9070b90c0ac462e3c22078bb4c",
        },
        { url: "/not_found.png", revision: "adf22c7aff635add6d4680dd9c6c2b56" },
        { url: "/og-image.png", revision: "910779350ca6bd35332438d14e950465" },
        {
          url: "/partners/1.png",
          revision: "92a4a88429fef12976f9a907bb5a95fe",
        },
        {
          url: "/partners/2.png",
          revision: "35616b87aee9211c63e7705896b1410b",
        },
        {
          url: "/partners/3.png",
          revision: "b6d0bfc7ce6f9065bdf0ae14154cb12c",
        },
        {
          url: "/partners/4.png",
          revision: "6e7233334881d251d241a01300bc214a",
        },
        {
          url: "/partners/5.png",
          revision: "1e07fe5e4acd2944781966b1adcf32f3",
        },
        {
          url: "/partners/Thumbs.db",
          revision: "cbcf1a1443ae3f355ea28caefcac0b31",
        },
        {
          url: "/partners/map.png",
          revision: "7b21c6af0be444e60b0d09cba8bc6e2e",
        },
        {
          url: "/partners/partner_logo_1.png",
          revision: "c5b83dacb1f13b12bf98eea9dcf3d8e6",
        },
        {
          url: "/partners/partner_logo_2.png",
          revision: "d7c28ab5668c2c79c4c0a3f8e7cfdaa2",
        },
        {
          url: "/partners/partner_logo_3.png",
          revision: "9e47c7deccbc49594cc10c681feda40f",
        },
        {
          url: "/partners/partner_logo_4.png",
          revision: "c8e5772182ddd13d37d5c495b44e4da1",
        },
        {
          url: "/partners/partner_logo_5.png",
          revision: "f3d5ebaf72028e5d24e3be24a47105fc",
        },
        {
          url: "/promo_img_1.jpg",
          revision: "3be953972b53d24381853058e88f0ad7",
        },
        {
          url: "/quotation_form_bg.jpg",
          revision: "f9188f489b1b5c398a43ff7d1e99753a",
        },
        { url: "/robots.txt", revision: "40341b575ddcbc9955f35edfbff82062" },
        {
          url: "/services/service_1.jpg",
          revision: "ff3479679e61847fee4681374a084ac8",
        },
        {
          url: "/services/service_2.jpg",
          revision: "cc1092170eaf36b3dcd1dd3ace6d6734",
        },
        {
          url: "/services/service_3.jpg",
          revision: "fdb6690f273b2ce7a5e0265bcbf0b93c",
        },
        {
          url: "/services/service_4.jpg",
          revision: "f28473d6efe056776d5ae0223cde9af4",
        },
        { url: "/sitemap-0.xml", revision: "ca512543edbbffa8b66986db8c4d1253" },
        { url: "/sitemap.xml", revision: "127266ce08f6f34e742a9e65d58514f8" },
        { url: "/statistic.jpg", revision: "ad3b1fed2eb124095c6d8f3e3508de45" },
        {
          url: "/swe-worker-4da67dda9bc18c53.js",
          revision: "5a47d90db13bb1309b25bdf7b363570e",
        },
        {
          url: "/swe-worker-4da67dda9bc18c53.js",
          revision: "5a47d90db13bb1309b25bdf7b363570e",
        },
        { url: "/team/1.jpg", revision: "448b8a617f3d0b2a064255e338280d77" },
        { url: "/team/2.jpg", revision: "fabde769b1130d7798a6cf343a66f1ad" },
        { url: "/team/3.jpg", revision: "09cd79b5059cc31b16e91e24ba718d72" },
        {
          url: "/testimonials/1.png",
          revision: "52b320af9dff29012ab2c4a73482f162",
        },
        {
          url: "/testimonials/2.png",
          revision: "0025835e5d5d05d9326a879d9b2a07a7",
        },
        {
          url: "/testimonials/testimonial_1.jpg",
          revision: "31da603cb225348dd136eb17c814c816",
        },
        {
          url: "/testimonials/testimonial_2.jpg",
          revision: "0aef552f28f35d50824e76b156436d2c",
        },
        {
          url: "/testimonials/testimonial_3.jpg",
          revision: "273a521e42d5025bcc9f25ec720787c0",
        },
        {
          url: "/testimonials/testimonial_layout_2_1.jpg",
          revision: "8f22da0271d723887530861bea225120",
        },
        {
          url: "/testimonials/testimonial_layout_2_2.jpg",
          revision: "08ed90151d2c774b4265bf84cba92c4a",
        },
        {
          url: "/wordpress-demo-import.xml",
          revision: "dec2dc6b6f534679de62db5c33c75612",
        },
      ],
      { ignoreURLParametersMatching: [/^utm_/, /^fbclid$/] },
    ),
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      "/",
      new e.NetworkFirst({
        cacheName: "start-url",
        plugins: [
          {
            cacheWillUpdate: async ({ response: e }) =>
              e && "opaqueredirect" === e.type
                ? new Response(e.body, {
                    status: 200,
                    statusText: "OK",
                    headers: e.headers,
                  })
                : e,
          },
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      new e.CacheFirst({
        cacheName: "google-fonts-webfonts",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 31536e3 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
      new e.StaleWhileRevalidate({
        cacheName: "google-fonts-stylesheets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-font-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-image-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 2592e3 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\/_next\/static.+\.js$/i,
      new e.CacheFirst({
        cacheName: "next-static-js-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\/_next\/image\?url=.+$/i,
      new e.StaleWhileRevalidate({
        cacheName: "next-image",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:mp3|wav|ogg)$/i,
      new e.CacheFirst({
        cacheName: "static-audio-assets",
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:mp4|webm)$/i,
      new e.CacheFirst({
        cacheName: "static-video-assets",
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:js)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-js-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 48, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:css|less)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-style-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\/_next\/data\/.+\/.+\.json$/i,
      new e.StaleWhileRevalidate({
        cacheName: "next-data",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:json|xml|csv)$/i,
      new e.NetworkFirst({
        cacheName: "static-data-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      ({ sameOrigin: e, url: { pathname: a } }) =>
        !(!e || a.startsWith("/api/auth/callback") || !a.startsWith("/api/")),
      new e.NetworkFirst({
        cacheName: "apis",
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      ({ request: e, url: { pathname: a }, sameOrigin: c }) =>
        "1" === e.headers.get("RSC") &&
        "1" === e.headers.get("Next-Router-Prefetch") &&
        c &&
        !a.startsWith("/api/"),
      new e.NetworkFirst({
        cacheName: "pages-rsc-prefetch",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      ({ request: e, url: { pathname: a }, sameOrigin: c }) =>
        "1" === e.headers.get("RSC") && c && !a.startsWith("/api/"),
      new e.NetworkFirst({
        cacheName: "pages-rsc",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      ({ url: { pathname: e }, sameOrigin: a }) => a && !e.startsWith("/api/"),
      new e.NetworkFirst({
        cacheName: "pages",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      ({ sameOrigin: e }) => !e,
      new e.NetworkFirst({
        cacheName: "cross-origin",
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 3600 }),
        ],
      }),
      "GET",
    ),
    (self.__WB_DISABLE_DEV_LOGS = !0);
});
