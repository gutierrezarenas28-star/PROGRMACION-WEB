const url = 'https://pokeapi.co/api/v2/pokemon/pikachu';

async function main() {
    const response = await fetch(url);
    const data = await response.json();

    console.log("nombre: " + data.name);

    

    console.log("altura: " + data.height);
    console.log("abilidad: " + data.abilities[0].ability.name);
    console.log("tipo: " + data.types[0].type.name);
    console.log("peso: " + data.weight);

    console.log("Estatus de la respuesta:", response.status); 
    
    if (response.ok) {
        const data = await response.json();
        console.log("nombre: " + data.name);
    } else {
        console.log("Error: El Pokémon no fue encontrado.");
    }

    

}

main();