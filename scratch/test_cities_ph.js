const { City } = require('country-state-city');

const countryCode = 'PH';
const allCities = City.getCitiesOfCountry(countryCode);
console.log('Total Cities in PH:', allCities.length);

if (allCities.length > 0) {
    console.log('Sample City Data:', allCities.slice(0, 10).map(c => ({ name: c.name, stateCode: c.stateCode })));
}

const oroquieta = allCities.find(c => c.name.toLowerCase().includes('oroquieta'));
if (oroquieta) {
    console.log('Oroquieta Found:', oroquieta);
} else {
    console.log('Oroquieta not found in country list.');
}
