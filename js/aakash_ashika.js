class Jeopardy {
  constructor() {
    this.BASE_URL = "https://jservice.io/api/";
    this.allCategories = [];
    this.data = [];
    this.boardValues = [100, 200, 300, 400, 500];

    //get categories having 20 clues minimum -> https://jservice.io/api/categories?count=50 and sort them by highest clues to find max probability of 20 clues
    //store questions per value  and category wise by checking if 500, 400, 300 ,200 and 100 are there to make sure that only 5 clues are there
    //if question is d(one then replace it with new one
    //TODO:
    if (localStorage.getItem("jeopardyData")) {
      this.data = JSON.parse(localStorage.getItem("jeopardyData"));

      setTimeout(() => {
        this.buildBoard();
      }, 3000);
    } else {
      this.getCategories();
    }
  }

  async getCategories() {
    //fetch category API call
    const getCategoriesData = await fetch(this.BASE_URL + "categories?count=50")
      .then((res) => res.json())
      .catch((err) => {
        console.log(err);
        alert("Something went wrong ->" + err);
      });

    //sorting categories by highest clues to find max probability of  all required clues
    let filterCategories = getCategoriesData
      .sort((a, b) => b.clues_count - a.clues_count)
      .filter((item) => item.clues_count >= 20);

    this.allCategories = filterCategories.slice(0, 5);
    this.getQuestions(filterCategories.slice(0, 5));
    console.log("THis is the filterCategories", filterCategories.slice(0, 5));
  }

  async getQuestions() {
    const promiseArray = [];
    for (const category of this.allCategories) {
      promiseArray.push(
        this.getQuestionsByCategory(category.id, category.title)
      );
    }

    const allCategories = await Promise.allSettled(promiseArray);
    this.data = allCategories
      .filter((item) => item.status === "fulfilled" && item.value.valid)
      .map((validCategory) => validCategory.value.data);

    //TODO
    localStorage.setItem("jeopardyData", JSON.stringify(this.data));
    this.buildBoard();
    console.log("THIS QUESTIONS", this.data);
  }

  //Here we are going to get questions from each category and check if valid category having all required boardValues
  async getQuestionsByCategory(categoryId, categoryTitle) {
    let validCategory = true;
    const getQuestionsByCategoryData = await fetch(
      this.BASE_URL + "clues?category=" + categoryId
    ).then((res) => res.json());

    //Filter to check all boardValues of questions should be there
    this.boardValues.forEach((element) => {
      if (!getQuestionsByCategoryData.some((item) => item.value === element)) {
        //atleast one question should be available of this value
        validCategory = false;
      }
    });

    if (validCategory) {
      return {
        valid: true,
        data: {
          title: categoryTitle,
          questions: getQuestionsByCategoryData,
        },
      };
    } else {
      return {
        valid: false,
        data: {},
      };
    }
  }

  buildBoard() {
    const getBoard = document.querySelector("#board");
    console.log("GETTING DATA FROM LOCAL", this.data);
    if (getBoard) {
      console.log("COMING HERE", getBoard);
      //creating a board of 5 categories
      for (let index = 0; index < this.data.length; index++) {
        const ul = document.createElement("ul");
        ul.className = "category";
        const liHeading = document.createElement("li");
        liHeading.className = "category-heading";
        liHeading.innerHTML = this.data[index].title;

        const liItem = document.createElement("li");
        liItem.className = "category-item";

        for (let index = 0; index < this.boardValues.length; index++) {
          const button = document.createElement("button");
          button.innerHTML = `$${this.boardValues[index]}`;
          button.addEventListener("click", () => {
            this.openModal();
          });
          liItem.appendChild(button);
          ul.appendChild(liItem);
        }

        ul.prepend(liHeading);
        getBoard.appendChild(ul);

        console.log("AFTER BOARD", getBoard);
      }
    }
  }

  openModal() {
    const modal = document.getElementById("questionModal");
    modal.style.opacity = 1;
  }
}

new Jeopardy();
