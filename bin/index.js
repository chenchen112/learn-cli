#! /usr/bin/env node

const create = require("../scripts/create.js");

async function main() {
  try {
    console.log("------------cli start------------");
    await create();
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
