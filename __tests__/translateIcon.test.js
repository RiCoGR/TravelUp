import * as t from '../src/client/js/translateIcon';

describe('Frontend Test', () => {
    test('Get icon class for clear-day', () => {
        expect(t.getIconClass('clear-day')).toBe('icon-sun');
    });
});

describe('Frontend Test', () => {
    test('Get unknown icon class for unknown-weather', () => {
        expect(t.getIconClass('unknown-weather')).toBe('icon-sun');
    });
});
    

