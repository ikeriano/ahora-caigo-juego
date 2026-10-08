#!/bin/bash
# Construye la APK firmada con el contenido de dist/ (ejecutar antes: npm run build)
set -e
cd "$(dirname "$0")/.."
A=android/app/src/main/assets/www
rm -rf android/app/src/main/assets && mkdir -p $A
cp -r dist/. $A/ && rm -rf $A/descargas $A/sw.js $A/.git $A/.nojekyll
export JAVA_HOME=~/android/jdk17 ANDROID_HOME=~/android/sdk
export KS_PASS=$(sed -n 's/^Contraseña (store y key): //p' keystore/keystore-info.txt)
cd android && ~/android/gradle-8.7/bin/gradle --no-daemon -q assembleRelease
cp app/build/outputs/apk/release/app-release.apk ../AhoraCaigo3D.apk
ls -la ../AhoraCaigo3D.apk
