// Product ID to single Variant ID mapping
var tangent_selected_product_map;
let recommendIDfetch = false;

var default_addToCartText = "Add To Cart";
var default_addedToCartText = "Added to Cart!";
var default_add_all_to_cart_text = "Add All to Cart"
var out_of_stock_text = "Out of Stock";
var no_products_found_text ="No products found. Please retry!";

// Map variable to store add all to cart links for each sections
var sections_add_to_cart_map={};

// Tab title mapping based on tags
var tabs_title_mapping={
  section_basics:"Basics",
  section_essentials:"Essentials",
  section_works:"Works"
}


// Add default image url here
var tangent_default_selfie_image_url="https://aidabicaj.com/cdn/shop/articles/special-time-in-your-life-300867_1400x.jpg";
var default_variant_image_url ="https://file.tangent.ai/quiz-content/merchants/nitesh-dev-store/image/5009378275701413-no-image-2048-5e88c1b20e087fb7bbe9a3771824e743c244f437e4f8ba93bbf7b11b53f7824c_720x.webp"

let tangent_client_domain_currency;
var tangent_custom_tabs = document.querySelector("#tangent_custom_tabs");
var tangent_client_domain_url = window.location.origin;
var tangent_sections_wrapper_element = document.querySelector("#tangent_sections_wrapper"); 

let isPageLoadCalled = false;

// Use DOMContentLoaded to catch early loading
document.addEventListener("DOMContentLoaded", onLoadFunction);

// Use window.onload to catch full page load (if needed)
window.addEventListener("load", onLoadFunction);

function onLoadFunction(){
  if (!isPageLoadCalled) {
    isPageLoadCalled = true;
    var tangent_response_id = getClientResponseId()
    checkoutDataApiCall(tangent_response_id); 
  }
}

function getClientResponseId(){
  // Current Page Load URL
  var tangent_client_url = new URL(window.location.href);
  return tangent_client_url.searchParams.get("resp_id");
}

function checkoutDataApiCall(tangent_response_id){
  if (tangent_response_id != null) {
    var checkout_url = "https://service.tangent.ai/shopify/get-checkout-products?resp_id="+tangent_response_id+ "&self_serve=true" + "&multiple_variants=true";
    fetch(checkout_url)
    .then(data => {
      return data.json();
    })
    .then(response => {
      checkoutDataProcess(response);
      return response;
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  }
}

function checkoutDataProcess(response){
    let tangent_recommended_products = response.products;
    let selected_variants_map = response.selected_variants;
    tangent_client_domain_currency = document.querySelector("#tangent_client_currency").innerText+" "; 

    // Setting Default variant price symbol
    if (tangent_client_domain_currency == "") {
        tangent_client_domain_currency = '$';
    }

    // Setting selfie / default image
    setTangentSelfieSection(response);
  
    var tangent_product_sections = response.product_sections;
    var tangent_text_sections = response.text_sections;

    createTabButtons();
  
    if(tangent_product_sections!=undefined){
      createProductSection(tangent_product_sections, tangent_text_sections);
    }    
    setTabOpen(response.tags);
    if(response.text_sections!=undefined){
      createTextSection(tangent_product_sections,tangent_text_sections);
    }

    if (tangent_recommended_products.length > 0) {
        setProductsToView(tangent_recommended_products, tangent_product_sections, selected_variants_map);
        enableButtonListener();
        loadElementsOnResponseData();        
    }
    else {
        document.querySelector('#tangent-general-text').innerHTML = no_products_found_text;
    }

    if (response.description == '') {
        document.querySelector('#tangent-general-text').style.display = "block";
    }
}

function setProductsToView(products, sections, selected_variants) {
  tangent_selected_product_map = {};

  Object.keys(sections).forEach(section => {
    const product_ids = sections[section];
    const product_section_grid = document.getElementById(`${section}_product_grid`);
    
    // Create a document fragment for improved performance
    const fragment = document.createDocumentFragment();

    product_ids.forEach(id => {
      const product = products.find(p => String(p.id) === id);
      if (!product) return;

      // Ensure the product has variants
      if (!product.variants || product.variants.length === 0) {
        console.error(`Product ${product.id} does not have variants`);
        return;
      }

      const products_variant_list = selected_variants[id] || [];
      const hasSelectedVariants = products_variant_list.length > 0;

      // Handle product variants
      (hasSelectedVariants ? products_variant_list : [product.variants[0]]).forEach(variant_id => {
        const variant = getProductVariant(product, variant_id) || product.variants[0];
        tangent_selected_product_map[product.id] = variant.id;

        const product_html = getProductHTML(product, products.indexOf(product), variant, section, hasSelectedVariants);
        
        // Generate product HTML and append it to the fragment
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = product_html;

        // Append the created product HTML to the fragment
        while (tempDiv.firstChild) {
          fragment.appendChild(tempDiv.firstChild);
        }

        // Check product validity after rendering
        checkForProductValidity(sections, products, section, products.indexOf(product), variant);
      });
    });

    // Append the fragment to the DOM in one go
    product_section_grid.appendChild(fragment);
  });
}

function getProductVariant(product, variant_id){
  let variant_list = product.variants;
  for (let index = 0; index < variant_list.length; index++) {
    if(variant_list[index].id==variant_id){
      return variant_list[index];
    }
  }
  return null;
}

function getProductHTML(product, index, variant, section, enable_variant_title) {
  // Destructuring for clarity
  const { price: productPrice, id: variantId, title: variantTitle, image_id: variantImageId } = variant;
  const { handle: productHandle, title: productTitle } = product;
  
  // Set URLs and image
  const variantImageUrl = getVariantImage(variantImageId, product);
  const variantProductUrl = `${tangent_client_domain_url}/products/${productHandle}?variant=${variantId}`;
  
  // Determine if variant title is shown
  const variantLabel = enable_variant_title ? `<br>${variantTitle}` : '';
  
  // Product HTML using template literals
  return `
    <div class="tangent-product-item">
      <a id="url_tangent_product_${index}" class="tangent-text-link" target="_blank" href="${variantProductUrl}">
        <img id="image_tangent_product_${index}" src="${variantImageUrl}" class="tangent-product-image" alt="${productTitle}">
        <p class="tangent-product-title tangent-product-title-text">
          <b>${productTitle}</b>${variantLabel}
        </p>
        <p id="price_tangent_product_${index}" class="tangent-product-price-text">
          ${tangent_client_domain_currency}${productPrice}
        </p>
      </a>
      <div id="${section}_variant_${index}" class="tangent-product-variant"></div>
      <p class="tangent-btn-add tangent-add-to-cart-button" id="${section}_cart_tangent_product_${index}_text">
        <a class="tangent-product-add-btn-wrapper" id="${variantId}" href="javascript:void(0)">
          ${default_addToCartText}
        </a>
      </p>
    </div>
  `;
}


function setTabOpen(tags) {
  const tabWrapper = document.querySelector("#tab-wrapper");
  const tabContents = document.querySelectorAll(".tabcontent");
  const tabLinks = document.querySelectorAll(".tablinks");

  // Check if elements exist
  if (!tabWrapper || tabContents.length === 0 || tabLinks.length === 0) return;

  // Show tab wrapper
  tabWrapper.style.display = "block";

  // Determine the default tab index based on tags
  let tabIndex = 0;
  if (tags.includes("routine_10_mins")) {
    tabIndex = 1;
  } else if (tags.includes("routine_15_mins")) {
    tabIndex = 2;
  }

  // Hide all tab content and remove 'active' class from all links
  tabContents.forEach(tab => tab.style.display = "none");
  tabLinks.forEach(link => link.classList.remove("active"));

  // Show the appropriate tab content and activate the corresponding tab link
  tabContents[tabIndex].style.display = "block";
  tabLinks[tabIndex].classList.add("active");
}

function createTabButtons(){
  for (var section in tabs_title_mapping) {
   createTabButton(section)    
  }
}
function checkForProductValidity(product_sections, product_list, section, idx, selected_variant) {
  const cart_button = document.getElementById(`${section}_cart_tangent_product_${idx}_text`);
  
  // Ensure the cart button exists
  if (!cart_button) return;

  const product = product_list[idx];

  const cart_link = cart_button.getElementsByClassName("tangent-product-add-btn-wrapper")[0];
  
  // Check if the product is active
  if (product.status !== "active") {
    cart_link.innerHTML = out_of_stock_text;
    cart_button.classList.add("disable-btn-wrapper");
    return;
  }

  // If product is active, remove disable class
  cart_button.classList.remove("disable-btn-wrapper");

  // Handle inventory policy
  const { inventory_policy, inventory_quantity, inventory_management } = selected_variant || {};

  if (inventory_policy === "deny" && inventory_quantity < 1) {
    // Out of stock and inventory management is enabled
    if (inventory_management) {
      cart_link.innerHTML = out_of_stock_text;
      cart_button.classList.add("disable-btn-wrapper");
    } else {
      // Inventory management is null, allow adding to cart
      updateSectionAllToCartLink(product_sections, product.id, tangent_selected_product_map[product.id]);
    }
  } else {
    // Either not under inventory management or in stock
    updateSectionAllToCartLink(product_sections, product.id, tangent_selected_product_map[product.id]);
  }
}


// Updating add all to cart object for sections
function updateSectionAllToCartLink(product_sections,product_id,vid){
    if(product_sections!=undefined){
        for (const section in product_sections) {

            // Create and add all sections cart values to a map
            if (product_sections[section].includes(String(product_id))) {
                if(sections_add_to_cart_map[section]){
                    if(!sections_add_to_cart_map[section].list.includes(vid)){
                      sections_add_to_cart_map[section].count++;
                      sections_add_to_cart_map[section].cart_link =  sections_add_to_cart_map[section].cart_link+ "&id[]=" + vid;
                      sections_add_to_cart_map[section].list.push(vid);
                      
                      // Enable / disable add all to cart based on products count
                      if(sections_add_to_cart_map[section].count>1){
                          document.getElementById(section+"_add_all_to_cart").style.display="block";
                      }
                    }
                }
                else{
                    sections_add_to_cart_map[section] = {
                        count:1,
                        cart_link: tangent_client_domain_url + "/cart/add?id[]="+vid,
                        list:[vid]
                    }
                }
            }                                
        }
    }
}

// Add all to cart function for sections
function addAllTocartFunction(section) {  
    if(sections_add_to_cart_map[section]!=undefined){
        document.getElementById(section+"_add_all_cart_link").setAttribute("href", sections_add_to_cart_map[section].cart_link);
    } 
    else {
        var x = document.querySelector("#message-text");
        x.innerHTML = "We're currently sold out of the selected product(s). Please check back later!";
        x.className = "show";
        setTimeout(function () { x.className = x.className.replace("show", ""); }, 5000);
    }
}

const getVariantImage = (imageId, product) => {
    var product_image;
    
    if(imageId!=null){
        var all_images = product.images;
        if(all_images!=undefined){
            for(var im=0;im<all_images.length;im++){
                if(imageId==all_images[im].id){
                    product_image = all_images[im].src;
                }
            }
        }
    }
    else{
        if(product.image!=null){
            product_image = product.image.src;
        }
        else{
            product_image = 'https://file.tangent.ai/quiz-content/merchants/nitesh-dev-store/image/5009378275701413-no-image-2048-5e88c1b20e087fb7bbe9a3771824e743c244f437e4f8ba93bbf7b11b53f7824c_720x.webp';
        }
    }

    if(product_image== undefined || product_image==null){
        product_image = 'https://file.tangent.ai/quiz-content/merchants/nitesh-dev-store/image/5009378275701413-no-image-2048-5e88c1b20e087fb7bbe9a3771824e743c244f437e4f8ba93bbf7b11b53f7824c_720x.webp';
    }
    return product_image;
}

// Add To Cart Function
function addToCart(btn){ 
  let formData = {
   'items': [{
    'id': btn.id,
    'quantity': 1
    }]
  };
  fetch(window.Shopify.routes.root + 'cart/add.js', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formData)
  })
  .then(response => {
    if(btn!=undefined){
      btn.innerHTML = default_addedToCartText;
      btn.classList.add("added-to-cart-style"); 
    }    
    document.dispatchEvent(new CustomEvent('cart:build' , {bubbles: true})); 
    document.dispatchEvent(new CustomEvent('cart:refresh', {
        bubbles: true
    })); 
    return response.json();
  })
  .catch((error) => {
    console.error('Error:', error);
  });
}

// Toggle - selfie canvas 
function selfieCanvasDisplayToggle(display){
  document.querySelector("#selfie_canvas").style.display=display;  
}

// Main Section container 
function createSectionContainer(section_name){
    var section_container = document.createElement("div");
    section_container.id=section_name+"_container";
    return section_container;
}

// Add to cart button for sections
function createSectionAddAllToCart(section_name) {
    var add_all_to_cart_p_tag = document.createElement("p");
    add_all_to_cart_p_tag.id = section_name+"_add_all_to_cart";
    add_all_to_cart_p_tag.classList.add("section_add_all_to_cart");
    add_all_to_cart_p_tag.classList.add(section_name+"_add_all_to_cart");

    var add_all_cart_link = document.createElement("a");
    add_all_cart_link.id = section_name+"_add_all_cart_link";
    add_all_cart_link.classList.add("section_add_all_cart_link");
    add_all_cart_link.classList.add(section_name+"_add_all_cart_link");
    add_all_cart_link.href="#";
    add_all_cart_link.innerHTML = default_add_all_to_cart_text;

    // Enabling listener
    add_all_cart_link.addEventListener(
        'click',
        function () { addAllTocartFunction(section_name); },
        false
    );
    add_all_to_cart_p_tag.appendChild(add_all_cart_link);
    return add_all_to_cart_p_tag;
}

// Container having individual products
function addSectionProductGridContainer(section_name) {
    var product_grid_view_container = document.createElement("div");
    product_grid_view_container.id = section_name+"_product_grid";
    product_grid_view_container.classList.add("section_product_grid");
    product_grid_view_container.classList.add(section_name+"_product_grid");
    return product_grid_view_container;
}

// Tab buttons 
function createTabButton(section_name) {
    var tab_button = document.createElement("button");
    tab_button.id = section_name+"_tab_button";
    tab_button.innerHTML = getTabTitle(section_name);
    tab_button.name = section_name;
    tab_button.classList.add("tablinks");
    tab_button.addEventListener(
        'click',
        function () { switchTab(this); },
        false
    );
    tangent_custom_tabs.appendChild(tab_button);
}

function getTabTitle(section){
  var tab_title;
  if(tabs_title_mapping[section]!=undefined){
    tab_title = tabs_title_mapping[section];
  }
  else{
    tab_title = section.replace("section_","").replace("_"," ").toUpperCase();
  }
  return tab_title;
}

// Product Section Creation
function createProductSection(product_sections, text_sections){
    for (const section_name in product_sections) {
      // The created container will have both a container to show text and products
      var section_container = createSectionContainer(section_name);    
  
      // Creating text sections before products sections if exists
      if(text_sections!=undefined){
          createTextSectionBeforeProducts(text_sections,section_container,section_name);
      }    
      
      // Creating section to add all products
      section_container.appendChild(addSectionProductGridContainer(section_name));
  
      // Creating add all to cart button for the section    
      section_container.appendChild(createSectionAddAllToCart(section_name));

      if(section_name=="section_initialization_basics" || section_name=="section_treatment_basics"){
        var section_basics = document.querySelector("#section_basics_container");
        section_basics.appendChild(section_container);
      }
      else if(section_name=="section_initialization_essentials" || section_name=="section_treatment_essentials"){
        var section_essentials = document.querySelector("#section_essentials_container");
        section_essentials.appendChild(section_container);
      }
      else if(section_name=="section_initialization_works" || section_name=="section_treatment_works"){
        var section_works = document.querySelector("#section_works_container");
        section_works.appendChild(section_container);
      }
      else if(section_name=="section_additional_skin_tone"){
        var section_additional_skintone_products = document.querySelector("#section_additional_skin_tone_container");
        section_additional_skintone_products.appendChild(section_container);
      }
      else if(section_name=="section_additional_lifesyle"){
        var section_additional_lifestyle_products = document.querySelector("#section_additional_lifesyle_container");
        section_additional_lifestyle_products.appendChild(section_container);
      }
      else{
        console.log("not found section");
      }
    }
}

// Text Sections with products sections
function createTextSectionBeforeProducts(text_sections,section_container, section_name){
    if(text_sections[section_name]!=undefined){
        var section_div = document.createElement("div");
        section_div.id = section_name+"_text_container";
        section_div.classList.add("section_text_container");
        section_div.classList.add(section_name+"_text_container");
        section_div.innerHTML = text_sections[section_name].join(' ');
        section_container.appendChild(section_div);
    }
}

// Section Text Creation (one without a product section)
function createTextSection(product_sections, text_sections){
    for (const section_name in text_sections) {
        // For removing duplicate entry
        if(product_sections[section_name]==undefined){
            var section_container = createSectionContainer(section_name);

            var section_div = document.createElement("div");
            section_div.id = section_name+"_text_container";
            section_div.classList.add("section_text_container");
            section_div.classList.add(section_name+"_text_container");
            section_div.innerHTML = text_sections[section_name].join(' ');
            section_container.appendChild(section_div);  

            // To Add to top of the page container
            if(section_name == "section_selfie"){
              var section_selfie = document.querySelector("#section_selfie_container_parent");
              section_container.classList.remove('tabcontent');   
              section_selfie.appendChild(section_container);
            }
            else if(section_name == "section_additional_content"){
              var section_additional = document.querySelector("#section_additional_content_container_parent");
              section_container.classList.remove('tabcontent');   
              section_additional.appendChild(section_container);
            }
            else{
              // Add to main container wrapper
              // tangent_sections_wrapper_element.appendChild(section_container); 
            }   
        }
    }
}

// Setting Selfie / Default Image
function setTangentSelfieSection(response) {
    hideLoading();
    if(response.selfie_html!=null && response.selfie_html!=undefined){
      document.getElementById("tangent_selfie_container").innerHTML = response.selfie_html;
    }
    else{
        if(response.selfie_url!=undefined && response.selfie_url!=null){
          document.querySelector('#tangent_selfie_image').src = response.selfie_url;
        }
        else{
            if(tangent_default_selfie_image_url!=""){
                document.querySelector('#tangent_selfie_image').src = tangent_default_selfie_image_url;
            }
            else{
                document.querySelector("#tangent_selfie_container").style.display = "none";
            }
        }
    }
}

// Handle Tab button selection
function switchTab(element) {
  let i, tabcontent, tablinks;

  // This is to clear the previous clicked content.
  tabcontent = document.querySelectorAll(".tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  
  tablinks = document.querySelectorAll(".tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // Display the clicked tab and set it to active.
  document.getElementById(element.name+"_container").style.display = "block";
  document.getElementById(element.name+"_tab_button").classList.add("active");
}

// Enabling button listeners
function enableButtonListener() {
  // Listener for "Add to Cart" buttons
  const allBtns = document.querySelectorAll('.tangent-product-add-btn-wrapper');
  
  allBtns.forEach(button => {
    button.addEventListener('click', function(event) {
      addToCart(this);
    }, false);
  });
}

function loadElementsOnResponseData(){
  var all_elements = document.querySelectorAll('.load-on-data');
  for (var ae = 0; ae < all_elements.length; ae++) {
      all_elements[ae].style.display="block";
  }
}

// Hide loading
function hideLoading(){
  document.querySelector("#loading-section").style.display = "none";
}
