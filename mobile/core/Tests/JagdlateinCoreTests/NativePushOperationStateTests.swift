import Foundation
import XCTest
@testable import JagdlateinCore

final class NativePushOperationStateTests: XCTestCase {
    func testOnlyOneEnableRunsAndOldFinishCannotReleaseItsSuccessor() throws {
        var state = NativePushOperationState()
        let first = try XCTUnwrap(state.beginEnable())
        XCTAssertNil(state.beginEnable())
        XCTAssertTrue(state.finishEnable(first, successful: true))
        XCTAssertTrue(state.canRevokeCompletedEnable(first))
        let second = try XCTUnwrap(state.beginEnable())
        XCTAssertFalse(state.finishEnable(first, successful: false))
        XCTAssertEqual(state.current, second)
        XCTAssertFalse(state.canRevokeCompletedEnable(first))
    }

    func testOldCompletedReplyRollbackCannotInterruptANewerPendingOrSuccessfulEnable() throws {
        var state = NativePushOperationState()
        let first = try XCTUnwrap(state.beginEnable())
        XCTAssertTrue(state.finishEnable(first, successful: true))
        let second = try XCTUnwrap(state.beginEnable())
        XCTAssertNil(state.beginDisable(expectedEnable: first))
        XCTAssertEqual(state.current, second)
        XCTAssertTrue(state.finishEnable(second, successful: true))
        XCTAssertNil(state.beginDisable(expectedEnable: first))
        XCTAssertTrue(state.canRevokeCompletedEnable(second))
        XCTAssertNotNil(state.beginDisable(expectedEnable: second))
    }

    func testUnregisterTimeoutKeepsTheGateUntilTheActualSDKCompletion() throws {
        var state = NativePushOperationState()
        let ticket = try XCTUnwrap(state.beginEnable())
        XCTAssertTrue(state.beginRevocation(ticket))
        // A bounded caller has returned an error, but its HTTP unregister is
        // still unresolved. Cleanup/defer must not release that operation.
        XCTAssertFalse(state.finishEnable(ticket, successful: false))
        XCTAssertNil(state.beginEnable())
        XCTAssertNil(state.beginDisable())
        XCTAssertEqual(state.current, ticket)
        XCTAssertTrue(state.revoking)
        XCTAssertTrue(state.finishRevocation(ticket))
        XCTAssertNotNil(state.beginEnable())
    }

    func testStaleUnregisterCompletionCannotFinishOrResumeTheSuccessorOperation() throws {
        var state = NativePushOperationState()
        let old = try XCTUnwrap(state.beginDisable())
        XCTAssertTrue(state.beginRevocation(old))
        XCTAssertTrue(state.finishRevocation(old))
        let fresh = try XCTUnwrap(state.beginEnable())
        XCTAssertFalse(state.finishRevocation(old))
        XCTAssertEqual(state.current, fresh)
        XCTAssertFalse(state.revoking)
        XCTAssertTrue(state.beginRevocation(fresh))
        XCTAssertFalse(state.finishRevocation(old))
        XCTAssertEqual(state.current, fresh)
        XCTAssertTrue(state.revoking)
    }

    func testExplicitDisableCancelsItsPendingEnableAndOnlyItsOwnRevocationCompletes() throws {
        var state = NativePushOperationState()
        let enable = try XCTUnwrap(state.beginEnable())
        let disable = try XCTUnwrap(state.beginDisable())
        XCTAssertFalse(state.isCurrent(enable))
        XCTAssertTrue(state.isCurrent(disable))
        XCTAssertFalse(state.beginRevocation(enable))
        XCTAssertFalse(state.finishEnable(enable, successful: true))
        XCTAssertTrue(state.beginRevocation(disable))
        XCTAssertFalse(state.finishRevocation(enable))
        XCTAssertTrue(state.finishRevocation(disable))
        XCTAssertNil(state.current)
        XCTAssertFalse(state.canRevokeCompletedEnable(enable))
    }
}
