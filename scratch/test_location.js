const { Country, State, City } = require('country-state-city');

const countryCode = 'PH';
const states = State.getStatesOfCountry(countryCode);
console.log('States in PH:', states.length);

const misamis = states.find(s => s.name.toLowerCase().includes('misamis occidental'));
if (misamis) {
    console.log('Found:', misamis.name, 'Code:', misamis.isoCode);
    const cities = City.getCitiesOfState(countryCode, misamis.isoCode);
    console.log(`Cities in ${misamis.name}:`, cities.length);
    if (cities.length > 0) {
        console.log('Sample Cities:', cities.slice(0, 5).map(c => c.name));
    }
} else {
    console.log('Misamis Occidental not found in states list.');
}
