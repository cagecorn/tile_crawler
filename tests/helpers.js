import assert from 'assert';

export function test(name, fn) {
    try {
        fn();
        console.log(`✅ PASSED: ${name}`);
    } catch (e) {
        console.error(`❌ FAILED: ${name} - ${e.message}`);
    }
}

export { assert };
