class Jeopardy {
  constructor() {
    this.BASE_URL = "https://jservice.io/api/";
    this.allCategories = [];
    this.questions = [];
    this.boardValues = [100, 200, 300, 400, 500];

    //get categories having 5 clues minimum -> https://jservice.io/api/categories?count=20 and sort them by highest clues to find max probability of 5 clues
    //store questions per value  and category wise by checking if 500, 400, 300 ,200 and 100 are there to make sure that only 5 clues are there
    //if question is d(one then replace it with new one
    this.getCategories();
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
      .filter((item) => item.clues_count >= 5);

    this.allCategories = filterCategories;
    this.getQuestions();
    console.log("THis is the filterCategories", filterCategories);
  }

  async getQuestions() {
    const promiseArray = [];
    for (const category of this.allCategories) {
      promiseArray.push(
        this.getQuestionsByCategory(category.id, category.title)
      );
    }

    const allCategories = await Promise.allSettled(promiseArray);
    allCategories
      .filter((item) => item.status === "fulfilled" && item.value.valid)
      .map((validCategory) => validCategory.value.data);
  }

  async getQuestionsByCategory(categoryId, categoryTitle) {
    //Here we are going to get questions from each category and check if valid category having all required boardValues
    let validCategory = true;
    const getQuestionsByCategoryData = await fetch(
      this.BASE_URL + "clues?category=" + categoryId
    ).then((res) => res.json());

    //Filter to check all boardValues of questions should be there
    this.boardValues.forEach((element) => {
      if (!getQuestionsByCategoryData.some((item) => item.value === element)) {
        //atleast one question should be available
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

  getAnswers() {}

  setBoard() {}
}

new Jeopardy();
