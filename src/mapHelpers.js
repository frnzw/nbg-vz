

// placesLayer
export const createPersonViewLinkAndIcon = function(persId, emit) {
        const button = document.createElement('button');
        button.style.color = '#0078A8';            
        button.style.textDecoration = 'underline';
        button.title ='View Person in Person View';
        button.textContent = `${persId}`;
        button.onclick = async function() {
            console.log(`Clicked on ${persId}`);
            emit('person-selected', persId)
        }

        const icon = document.createElement('i');
        icon.classList.add('mdi', 'mdi-account-outline');
        icon.style.paddingLeft = '3px';

        return [button, icon]
    }