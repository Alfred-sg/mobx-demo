import { observable, action, computed, transaction } from "mobx";
import CategoryService from 'services/category';

let cache = [];
let loadByLevelFlags = {};

export default class Category extends CategoryService {
  @observable categories = [];

  async getCategory(params){
    const { cid, level } = params;
    if ( level ){
      const res = this.getCategoryByLevel(level);
      return res;
    };

    if ( cid ){
      const res = this.getCategoryByCid(cid);
      return res;
    };
  }

  async getCategoryByLevel(level){
    if ( loadByLevelFlags[level] ){
      cache.map(this.insertToCategories);
    } else {
      const res = await super.getCategory({ level });
      if ( res && res.code === 200 && res.data ){
        loadByLevelFlags[level] = true;

        // 将多次数据变更合成一个事务，减少重绘的次数
        transaction(() => {
          res.data.map(item => {
            if ( !cache.some(it => it.id === item.id) )
              cache.push(item);
  
            this.insertToCategories(item);
          });
        });

        return res.data;
      };

      return null;
    };
  }

  @action
  async getCategoryByCid(cid){
    if ( cache[cid] ){
      this.insertToCategories(cache[cid]);
    } else {
      const res = await super.getCategory({ cid });
      if ( res && res.code === 200 && res.data ){
        loadByLevelFlags[level] = true;

        // 将多次数据变更合成一个事务，减少重绘的次数
        transaction(() => {
          res.data.map(item => {
            if ( !cache.some(it => it.id === item.id) )
              cache.push(item);

            this.insertToCategories(item);
          });
        });

        return res.data;
      };

      return null;
    };
  }

  @action
  insertToCategories(category){
    if ( !this.categories.some(item => item.id == category.id) ){
      this.categories.push(category);
    };
  }

  @computed
  get categoriesTree(){
    let tree = [];
    this.categories.toJS().sort((a, b) => a.level - b.level).filter(item => {
      if ( item.level == 1 ){
        tree.push({
          value: item.id,
          label: item.name,
          isLeaf: false
        });
      } else if ( item.level == 2 ){
        let parent = tree.filter(it => it.value == item.parentId)[0];
        if ( !parent.children ) parent.children = [];
        parent.children.push({
          value: item.id,
          label: item.name
        });
      };
    });

    return tree;
  }
}
