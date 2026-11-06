const url = 'https://pokeapi.co/api/v2/pokemon/pikachu';

async function main() {
    const response = await fetch(url);
    const data = await response.json();


    console.log("code:", response.status);
    

    

}

main();