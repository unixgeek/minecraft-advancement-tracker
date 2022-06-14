import {get_advancement_namespace_prefixes, get_advancements} from "../../crate/Cargo.toml";
import titleCase from "ap-style-title-case";

class Advancement {
    name;
    done;
    criteria;

    constructor(object) {
        Object.assign(this, object);
    }

    /*
     * The category is the first part of the name, delineated by '/'.
     * The name is the last part, after the '/'.
     *
     * Example: minecraft:adventure/adventuring_time
     * category = minecraft:adventure
     * name = adventuring_time
     */

    getCategory() {
        return this.name.substring(this.name.indexOf(":") + 1, this.name.indexOf("/"));
    }

    getName() {
        return titleCase(this.name.substring(this.name.indexOf("/") + 1).replaceAll("_", " "));
    }

    getCompletedCriteria() {
        return this.#filterCriterion(true);
    }

    getNotCompletedCriteria() {
        return this.#filterCriterion(false);
    }

    getCriteriaCount() {
        return this.criteria.length;
    }

    #filterCriterion(done) {
        return this.criteria.filter(c => c.done === done).map(c => new Criterion(c));
    }
}

class Criterion {
    value;
    done;

    constructor(object) {
        Object.assign(this, object);
    }

    getName() {
        // The name is in the format of minecraft:wooded_badlands. Take the value after ':' and format it.
        return titleCase(this.value.substring(this.value.indexOf(":") + 1).replaceAll("_", " "));
    }
}

function getAdvancements(json) {
    return get_advancements(json).map(advancement => new Advancement(advancement));
}

function getCategories() {
    // A namespace prefix is in the format of 'minecraft:adventure'. The category is after the ':'.
    return get_advancement_namespace_prefixes().map(namespace => namespace.substring(namespace.indexOf(":") + 1));
}

export {getAdvancements, getCategories}
