export type TriviaConfig = {
    search: string;
    name: string;
    icon: string;
};

export const triviaItems: TriviaConfig[] = [
    // Culture
    {
        search: 'Stiftung Oper in Berlin',
        name: 'the Opera Foundation (State Opera, Deutsche Oper, Komische Oper)',
        icon: '🎭'
    },
    { search: 'Konzerthaus Berlin', name: 'the Konzerthaus Berlin', icon: '🎻' },
    { search: 'Volksbühne', name: 'the Volksbühne Theater', icon: '🎭' },
    { search: 'Berliner Philharmoniker', name: 'the Berliner Philharmoniker', icon: '🎼' },
    { search: 'Friedrichstadt-Palast', name: 'the Friedrichstadt-Palast', icon: '💃' },
    { search: 'Zentral- und Landesbibliothek', name: 'Libraries (ZLB)', icon: '📚' },
    // { search: "Musicboard", name: "the Musicboard Berlin", icon: "🕺" },
    { search: 'Tierpark Berlin', name: 'the Tierpark Berlin (Zoo)', icon: '🐻‍❄️' },

    { search: 'Zuschuss an die BVG', name: 'Inner-city Public Transport (BVG)', icon: '🚌' },
    { search: 'S-Bahn', name: 'the S-Bahn', icon: '🚆' },
    // { search: "Lichtsignalanlagen", name: "Traffic Lights", icon: "🚦" },
    { search: 'öffentlichen Toilettenanlagen', name: 'Public Toilets', icon: '🚽' },
    { search: 'Straßenreinigung', name: 'Street Cleaning', icon: '🧹' },
    { search: 'Straßenbeleuchtung', name: 'Street Lighting', icon: '💡' },
    { search: 'Tiefbau', name: 'Road Maintenance & Engineering', icon: '🚧' }, // Matches "Tiefbau und Straßenverwaltung"

    // { search: "Feuerwehr", name: "Fire Services", icon: "🚒" },

    { search: 'Schulbau', name: 'Building New Schools', icon: '🏗️' },
    { search: 'Mittagsverpflegung Schule', name: 'School Lunches', icon: '🍝' },

    { search: 'Charité', name: 'the Charité Hospital', icon: '🏥' },
    { search: 'Vivantes', name: 'Vivantes Hospitals', icon: '🏥' },

    { search: 'Abgeordnetenhaus', name: 'the Parliament (Abgeordnetenhaus)', icon: '🏛️' },
    { search: 'Berliner Bäder-Betriebe', name: 'Public Pools', icon: '🏊' },
    // { search: "Olympiastadion", name: "the Olympiastadion", icon: "🏟️" },
    // { search: "Tierschutz", name: "Animal Protection", icon: "🐈" },

    { search: 'Zinsen für sonstige Kreditmarktmittel', name: 'Interest on State Debt', icon: '📉' },

    { search: 'Sachausgaben für nachweispflichtige Vordrucke', name: 'Paper Forms', icon: '📄' },
    { search: 'Kommunikation Hauptstadtmarke', name: 'Capital City Branding', icon: '📢' },
    {
        search: 'Barleistungen in Einrichtungen',
        name: 'Cash Handouts in Asylum Facilities',
        icon: '💶'
    },

    // { search: "Mietzuschüsse", name: "Rent Subsidies", icon: "🏠" },
    { search: 'Flüchtlingsunterkünften', name: 'Refugee Accommodation', icon: '⛺' },
    {
        search: 'Laufende Leistungen zum Lebensunterhalt',
        name: 'Benefits for Asylum Seekers',
        icon: '🤝'
    }, // "Laufende Leistungen zum Lebensunterhalt nach SGB XII und AsylbLG"
    {
        search: 'Landesantidiskriminierungsstelle',
        name: 'State Office for Equal Treatment (LADS)',
        icon: '⚖️'
    },
    {
        search: 'Ausgaben für Unterkunft und Heizung',
        name: "Citizens' Allowance Accommodation",
        icon: '🏘️'
    },

    { search: 'Deutschlandticket', name: 'Deutschlandticket Subsidy', icon: '🎫' },
    { search: 'infraVelo', name: 'InfraVelo (Bike Planning)', icon: '🚲' },
    { search: 'Verbesserung des Radverkehrs', name: 'Bicycle Traffic Improvements', icon: '🎨' },
    { search: 'Radverkehrsprojekten', name: 'Cycling Infrastructure Projects', icon: '🚧' },

    { search: 'Berlin Energie Rekom 3', name: "Buying Vattenfall's Heating Grid", icon: '🔥' },
    { search: 'BEN Berlin Energie', name: 'Buying the Gas Network (BEN Berlin Energie)', icon: '⛽' },
    { search: 'Vivantes', name: 'Vivantes Hospitals Capital Injection', icon: '🏥' },
    { search: 'Messe Berlin', name: 'Messe Berlin Capital Injection', icon: '🎪' },
    { search: 'Tempelhof Projekt', name: 'Tempelhof Field Management', icon: 'kite' },
    { search: 'Tegel Projekt', name: 'Tegel Airport Development', icon: '✈️' },

    { search: 'Maßregelvollzug', name: 'Psychiatric Detention (Maßregelvollzug)', icon: '🏥' },
    { search: 'Verfassungsschutz', name: 'State Security (Verfassungsschutz)', icon: '🕵️' },
    { search: 'Body- und Dashcams', name: 'Police Body Cams', icon: '🎥' }
];
