#!/bin/sh

echo "Set exit on simple errors"
set -e

PACKAGENAME=BarcodeScannerFramework
OUTPUTPATH=$(PWD)/build
COPYPATH=../../../platforms/ios
# make xcode builds deterministic
export ZERO_AR_DATE=1

rm -rf $OUTPUTPATH

echo "Build for iphonesimulator"
xcodebuild \
    -project $PACKAGENAME.xcodeproj \
    -scheme $PACKAGENAME \
    -sdk iphonesimulator \
    -configuration Release \
    clean build \
    BUILD_DIR=$OUTPUTPATH \
    SKIP_INSTALL=NO \
    -quiet

echo "Build for iphoneos"
xcodebuild \
    -project $PACKAGENAME.xcodeproj \
    -scheme $PACKAGENAME \
    -sdk iphoneos \
    -configuration Release \
    clean build \
    BUILD_DIR=$OUTPUTPATH \
    CODE_SIGN_IDENTITY="" \
    CODE_SIGNING_REQUIRED=NO \
    SKIP_INSTALL=NO \
    -quiet

echo "Creating XCFramework"
xcodebuild \
    -create-xcframework \
    -framework $OUTPUTPATH/Release-iphoneos/$PACKAGENAME.framework \
    -debug-symbols $OUTPUTPATH/Release-iphoneos/$PACKAGENAME.framework.dSYM \
    -framework $OUTPUTPATH/Release-iphonesimulator/$PACKAGENAME.framework \
    -debug-symbols $OUTPUTPATH/Release-iphonesimulator/$PACKAGENAME.framework.dSYM \
    -output $OUTPUTPATH/$PACKAGENAME.xcframework


mkdir -p $COPYPATH
cp -R $OUTPUTPATH/$PACKAGENAME.xcframework $COPYPATH/