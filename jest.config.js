module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  setupFiles: ['./jest.env.js'],
  reporters: [
    "default", 
    [ 
      "jest-junit", {
        outputName: "junit.xml",
        ancestorSeparator: " › " ,
        classNameTemplate: "{classname}",
        titleTemplate: "{title}",
        suiteNameTemplate: "{filename}"
      }
    ]
  ],
  testResultsProcessor: "./node_modules/jest-html-reporter",
};
