// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "JagdlateinCore",
    platforms: [.iOS(.v15), .macOS(.v12)],
    products: [.library(name: "JagdlateinCore", targets: ["JagdlateinCore"])],
    targets: [
        .target(name: "JagdlateinCore"),
        .testTarget(name: "JagdlateinCoreTests", dependencies: ["JagdlateinCore"])
    ]
)
