export type TriviaConfig = {
    search: string;
    name: string;
    question: string;
    icon: string;
};

export const triviaItems: TriviaConfig[] = [
    // Culture
    { search: "Stiftung Oper in Berlin", name: "the Opera Foundation (State Opera, Deutsche Oper, Komische Oper)", question: "Did you catch a show this year?", icon: "🎭" },
    { search: "Konzerthaus Berlin", name: "the Konzerthaus Berlin", question: "Have you heard the symphony lately?", icon: "🎻" },
    { search: "Volksbühne", name: "the Volksbühne Theater", question: "Was the performance avant-garde enough for you?", icon: "🎭" },
    { search: "Berliner Philharmoniker", name: "the Berliner Philharmoniker", question: "Enjoying the world-class music?", icon: "🎼" },
    { search: "Friedrichstadt-Palast", name: "the Friedrichstadt-Palast", question: "Did you see the kick-line?", icon: "💃" },
    { search: "Zentral- und Landesbibliothek", name: "Libraries (ZLB)", question: "Did you borrow a book or just use the wifi?", icon: "📚" },
    // { search: "Musicboard", name: "the Musicboard Berlin", question: "Did you go dancing this weekend?", icon: "🕺" },
    { search: "Tierpark Berlin", name: "the Tierpark Berlin (Zoo)", question: "Have you visited the polar bears?", icon: "🐻‍❄️" },

    // Transport & Infra
    { search: "Zuschuss an die BVG", name: "Inner-city Public Transport (BVG)", question: "Did the bus come on time?", icon: "🚌" },
    { search: "S-Bahn", name: "the S-Bahn", question: "Was there a signal failure today?", icon: "🚆" },
    // { search: "Lichtsignalanlagen", name: "Traffic Lights", question: "Did you hit all the green lights?", icon: "🚦" },
    { search: "öffentlichen Toilettenanlagen", name: "Public Toilets", question: "Was it clean when you needed it?", icon: "🚽" },
    { search: "Straßenreinigung", name: "Street Cleaning", question: "Does your street look clean?", icon: "🧹" },
    { search: "Straßenbeleuchtung", name: "Street Lighting", question: "Is your street bright enough at night?", icon: "💡" },
    { search: "Tiefbau", name: "Road Maintenance & Engineering", question: "Is your suspension okay?", icon: "🚧" }, // Matches "Tiefbau und Straßenverwaltung"

    // { search: "Feuerwehr", name: "Fire Services", question: "Hopefully you won't need one.", icon: "🚒" },

    // Education
    { search: "Schulbau", name: "Building New Schools", question: "Is the paint dry yet?", icon: "🏗️" },
    { search: "Mittagsverpflegung Schule", name: "School Lunches", question: "Was the pasta good today?", icon: "🍝" },

    { search: "Charité", name: "the Charité Hospital", question: "Feeling healthy?", icon: "🏥" },
    { search: "Vivantes", name: "Vivantes Hospitals", question: "Still feeling healthy?", icon: "🏥" },

    { search: "Abgeordnetenhaus", name: "the Parliament (Abgeordnetenhaus)", question: "Do you like your representative?", icon: "🏛️" },
    { search: "Berliner Bäder-Betriebe", name: "Public Pools", question: "Did you go for a swim?", icon: "🏊" },
    // { search: "Olympiastadion", name: "the Olympiastadion", question: "Ready for the next match?", icon: "🏟️" },
    // { search: "Tierschutz", name: "Animal Protection", question: "How are the stray cats doing?", icon: "🐈" },

    { search: "Zinsen für sonstige Kreditmarktmittel", name: "Interest on State Debt", question: "Still paying for the banking scandal?", icon: "📉" },

    // Bureaucracy
    { search: "Sachausgaben für nachweispflichtige Vordrucke", name: "Paper Forms", question: "Because Berlin refuses to digitize fully.", icon: "📄" },
    { search: "Kommunikation Hauptstadtmarke", name: "Capital City Branding", question: "Paying for slogans nobody likes?", icon: "📢" },
    { search: "Barleistungen in Einrichtungen", name: "Cash Handouts in Asylum Facilities", question: "Pocket money provided by the state.", icon: "💶" },

    // Social & Housing
    // { search: "Mietzuschüsse", name: "Rent Subsidies", question: "Direct rent caps cost us a fraction of what we pay to buy back infrastructure.", icon: "🏠" },
    { search: "Flüchtlingsunterkünften", name: "Refugee Accommodation", question: "Are we being welcoming enough?", icon: "⛺" },
    { search: "Laufende Leistungen zum Lebensunterhalt", name: "Benefits for Asylum Seekers", question: "Direct transfer payments.", icon: "🤝" }, // "Laufende Leistungen zum Lebensunterhalt nach SGB XII und AsylbLG"
    { search: "Landesantidiskriminierungsstelle", name: "State Office for Equal Treatment (LADS)", question: "Funding the bureaucracy?", icon: "⚖️" },
    { search: "Ausgaben für Unterkunft und Heizung", name: "Citizens' Allowance Accommodation", question: "You pay the rent for those who don't work.", icon: "🏘️" }, // Heuristic mapping for Bürgergeld housing

    // Transport Politics
    { search: "Deutschlandticket", name: "Deutschlandticket Subsidy", question: "Cross-subsidizing regional travel for the country.", icon: "🎫" },
    { search: "infraVelo", name: "InfraVelo (Bike Planning)", question: "Dedicated to planning bike lanes.", icon: "🚲" },
    { search: "Verbesserung des Radverkehrs", name: "Bicycle Traffic Improvements", question: "More yellow paint on the roads?", icon: "🎨" },
    { search: "Radverkehrsprojekten", name: "Cycling Infrastructure Projects", question: "You paid more for street lights than safe lanes.", icon: "🚧" },

    // State Interventionism
    { search: "Berlin Energie Rekom 3", name: "Buying Vattenfall's Heating Grid", question: "State-run heating power.", icon: "🔥" },
    { search: "BEN Berlin Energie", name: "Buying the Gas Network (BEN Berlin Energie)", question: "More state monopolies funded by tax.", icon: "⛽" },
    { search: "Vivantes", name: "Vivantes Hospitals Capital Injection", question: "Bailing out the state-run hospital system?", icon: "🏥" },
    { search: "Messe Berlin", name: "Messe Berlin Capital Injection", question: "Subsidizing trade fairs.", icon: "🎪" },
    { search: "Tempelhof Projekt", name: "Tempelhof Field Management", question: "Managing a giant empty field.", icon: "kite" },
    { search: "Tegel Projekt", name: "Tegel Airport Development", question: "Guarding an airport that closed years ago.", icon: "✈️" },

    // Justice
    { search: "Maßregelvollzug", name: "Psychiatric Detention (Maßregelvollzug)", question: "Dealing with offenders deemed mentally ill.", icon: "🏥" },
    // { search: "Drohnen", name: "Police Drones", question: "Did you smile for the camera?", icon: "🚁" },
    { search: "Verfassungsschutz", name: "State Security (Verfassungsschutz)", question: "Do you feel watched?", icon: "🕵️" },
    { search: "Body- und Dashcams", name: "Police Body Cams", question: "Are you recording them?", icon: "🎥" }
];
