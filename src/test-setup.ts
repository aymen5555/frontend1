// Angular test environment setup for Vitest
import { TestBed } from '@angular/core/testing';
declare const require: any;

// Try to initialize the Angular testing environment if Angular testing modules are available.
// Try to initialize the Angular testing environment if Angular testing modules are available.
try {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const angularTesting = require('@angular/platform-browser-dynamic/testing');
	if (angularTesting?.BrowserDynamicTestingModule && angularTesting?.platformBrowserDynamicTesting) {
		TestBed.initTestEnvironment(
			angularTesting.BrowserDynamicTestingModule,
			angularTesting.platformBrowserDynamicTesting()
		);
	}
} catch (e) {
	// Angular testing packages not available or failed to load.
	console.warn('Failed to initialize Angular test environment:', e);
}

// You can add global mocks or polyfills here
