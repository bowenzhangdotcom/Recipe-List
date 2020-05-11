import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import {elements, renderLoader, clearLoader} from './views/base';

/** global state of the app
 * -Search Object
 * -Current recipie object
 * Shopping list object
 * Liked recipies
 */

const state = {}; 

//search controller

const controlSearch = async () => {
    //1. Get query from view
    const query = searchView.getInput();

    if(query) {
        //2. New search object and add to state
        state.search = new Search(query); 

        //3. Prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);

        try {
            //4. Search for recipies
            await state.search.getResults();
            clearLoader(); 

            //5. Render results on UI
            searchView.renderResults(state.search.result); 
        } catch(error) {
            alert('Something went wrong with the search');
            clearLoader(); 
        }
    }

}

elements.searchForm.addEventListener('submit', e=> {
    e.preventDefault(); 
    controlSearch();
}); 


elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage); 
    };
});

//Recipe controller

const controlRecipe = async () =>{
    //Get ID from URL
    const id = window.location.hash.replace('#','');
    if (id) {}
        //prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        //Create new recipe object
        state.recipe = new Recipe(id);

        //Highlight selected search item
        if (state.search) {searchView.highlightSelected(id)}; 

        try {
            //Get recipe data
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();

            //Calculate servings and time
            state.recipe.calcTime(); 
            state.recipe.calcServings(); 

            //Render recipe
            clearLoader();
            recipeView.renderRecipe(state.recipe, state.likes.isLiked(id)); 
        } catch (error) {
            console.log('Error processing recipe!'); 
        }
}

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

//List Controller

const controlList = () => {
    //Create a new list if there is none yet
    if (!state.list) state.list = new List(); 

    //Add each ingredient to the list
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
}

//Handle delete and update list item events
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid; 

    //Handle deletion
    if (e.target.matches('.shopping__delte, .shopping__delete *')) {
        //delete from state
        state.list.deleteItem(id);
        //delete from UI
        listView.deleteItem(id);
    
    //handle count update
    } else if (e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val); 
    }
});

//Like controller
const controlLike = () => {
    if (!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id; 
    //User has not yet liked current recipe
    if (!state.likes.isLiked(currentID)) {
        //Add like to the state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );
        //Toggle the button
        likesView.toggleLikeBtn(true);
        //Add like to the UI List
        likesView.renderLike(newLike);

    //user has liked current recipe
    } else {
        //Remove like from the state
        state.likes.deleteLike(currentID);
        //Toggle the button
        likesView.toggleLikeBtn(false);
        //Remove like from the UI List
        likesView.deleteLike(currentID);        
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
}

//Restore liked recipies on page load
window.addEventListener('load', () => {
    state.likes = new Likes(); 
    // Restore likes
    state.likes.readStorage(); 

    //Tottle like menu button
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    //render the existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like));
})

//Handling recipe button clicks
elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')) {
        // Decrease button is clicked
        if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec'); 
            recipeView.updateServingsIngredients(state.recipe); 
        };
    } else if (e.target.matches('.btn-increase, .btn-increase *')) {
        // Decrease button is clicked
        state.recipe.updateServings('inc'); 
        recipeView.updateServingsIngredients(state.recipe); 
    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        //add ingreidents to shopping list
        controlList();
    } else if (e.target.matches('.recipe__love, .recipe__love *')) {
        //Like controller
        controlLike();
    }
});