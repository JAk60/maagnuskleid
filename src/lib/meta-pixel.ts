declare global {
	interface Window {
		fbq: (
			method: string,
			eventName: string,
			params?: Record<string, unknown>,
			options?: { eventID?: string },
		) => void;
		_fbq: unknown;
	}
}

export const fbq = (
	eventName: string,
	params?: Record<string, unknown>,
	options?: { eventID?: string },
): void => {
	if (typeof window === "undefined") return;
	if (typeof window.fbq !== "function") return;
	if (params && options) {
		window.fbq("track", eventName, params, options);
	} else if (params) {
		window.fbq("track", eventName, params);
	} else {
		window.fbq("track", eventName);
	}
};
