const possibleUpgrades: Record<string, string[]> = {
    "8.0": ["8.1.3", "8.2.3", "8.3.3", "8.4.3", "8.5.3", "8.6.2", "8.7.1", "8.8.2", "8.9.2", "8.10.4", "8.11.4", "8.12.2", "8.13.4", "8.14.3", "8.15.5", "8.16.4", "8.17.2", "8.18.0"],
    "8.1": ["8.2.3", "8.3.3", "8.4.3", "8.5.3", "8.6.2", "8.7.1", "8.8.2", "8.9.2", "8.10.4", "8.11.4", "8.12.2", "8.13.4", "8.14.3", "8.15.5", "8.16.4", "8.17.2", "8.18.0"],
    "8.2": ["8.3.3", "8.4.3", "8.5.3", "8.6.2", "8.7.1", "8.8.2", "8.9.2", "8.10.4", "8.11.4", "8.12.2", "8.13.4", "8.14.3", "8.15.5", "8.16.4", "8.17.2", "8.18.0"],
    "8.3": ["8.4.3", "8.5.3", "8.6.2", "8.7.1", "8.8.2", "8.9.2", "8.10.4", "8.11.4", "8.12.2", "8.13.4", "8.14.3", "8.15.5", "8.16.4", "8.17.2", "8.18.0"],
    "8.4": ["8.5.3", "8.6.2", "8.7.1", "8.8.2", "8.9.2", "8.10.4", "8.11.4", "8.12.2", "8.13.4", "8.14.3", "8.15.5", "8.16.4", "8.17.2", "8.18.0"],
    "8.5": ["8.6.2", "8.7.1", "8.8.2", "8.9.2", "8.10.4", "8.11.4", "8.12.2", "8.13.4", "8.14.3", "8.15.5", "8.16.4", "8.17.2", "8.18.0"],
    "8.6": ["8.7.1", "8.8.2", "8.9.2", "8.10.4", "8.11.4", "8.12.2", "8.13.4", "8.14.3", "8.15.5", "8.16.4", "8.17.2", "8.18.0"],
    "8.7": ["8.8.2", "8.9.2", "8.10.4", "8.11.4", "8.12.2", "8.13.4", "8.14.3", "8.15.5", "8.16.4", "8.17.2", "8.18.0"],
    "8.8": ["8.9.2", "8.10.4", "8.11.4", "8.12.2", "8.13.4", "8.14.3", "8.15.5", "8.16.4", "8.17.2", "8.18.0"],
    "8.9": ["8.10.4", "8.11.4", "8.12.2", "8.13.4", "8.14.3", "8.15.5", "8.16.4", "8.17.2", "8.18.0"],
    "8.10": ["8.11.4", "8.12.2", "8.13.4", "8.14.3", "8.15.5", "8.16.4", "8.17.2", "8.18.0"],
    "8.11": ["8.12.2", "8.13.4", "8.14.3", "8.15.5", "8.16.4", "8.17.2", "8.18.0"],
    "8.12": ["8.13.4", "8.14.3", "8.15.5", "8.16.4", "8.17.2", "8.18.0"],
    "8.13": ["8.14.3", "8.15.5", "8.16.4", "8.17.2", "8.18.0"],
    "8.14": ["8.15.5", "8.16.4", "8.17.2", "8.18.0"],
    "8.15": ["8.16.4", "8.17.2", "8.18.0"],
    "8.16": ["8.17.2", "8.18.0"],
    "8.17": ["8.18.0"],
};
  
  export const getPossibleUpgrades = (version: string): string[] | null => {
    const versions = Object.keys(possibleUpgrades)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  
   
    const foundVersion = versions.find(v => compareVersions(v, version) >= 0);
  
    return foundVersion ? possibleUpgrades[foundVersion] : [];
  };
  
  
  const compareVersions = (a: string, b: string): number => {
    const aParts = a.split('.').map(Number);
    const bParts = b.split('.').map(Number);
  
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aVal = aParts[i] || 0;
      const bVal = bParts[i] || 0;
      if (aVal > bVal) return 1;
      if (aVal < bVal) return -1;
    }
    return 0;
  };
  
  