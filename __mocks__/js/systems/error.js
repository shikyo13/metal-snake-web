export const errorManager = {
    handleError: jest.fn((error, context, level) => {
        console.log(`Mock error handler: ${error.message}`);
        return context?.defaultValue || null;
    }),
    showNotification: jest.fn(),
    initSentry: jest.fn()
};