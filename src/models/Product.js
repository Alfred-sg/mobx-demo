import { observable, action, computed } from "mobx";
import ProductService from 'services/product';
import Category from './Category';
import Attribute from './Attribute';
import { mixin, mixinLocale, mixinStaticProperty } from 'utils/decorator';

const StatusList = [{
  text: '下架', value: 'offline'
}, {
  text: '上架', value: 'online'
}]

// @mixinLocale('model.product')
// 可采用继承的方式将远程请求方法混入到 Product 类中，此处使用 mixinStaticProperty 装饰器混入静态方法
@mixinStaticProperty(ProductService)
export default class Product {
  static StatusList = StatusList;

  category = new Category();
  attribute = new Attribute();

  @observable id;// 商品id
  @observable name;// 商品名称
  @observable cids;// 商品分类
  @observable attrValues = {};// 商品属性
  @observable num;// 库存
  @observable price;// 价格
  @observable desc;// 描述
  @observable status;// 状态

  @observable categories = [];// 商品分类全量信息

  constructor(props){
    // super(props);
    this.set(props);
  }

  // 数据全量更新；部分更新可使用赋值语句；重置可传空
  set(data = {}){
    this.id = data.id;
    this.name = data.name;
    this.cids = data.cids;
    this.attrValues = data.attrValues;
    this.num = data.num;
    this.price = data.price;
    this.desc = data.desc;
    this.status = data.status;
  }

  get(){
    return {
      id: this.id,
      name: this.name,
      cids: this.cids,
      attrValues: this.attrValues,
      num: this.num,
      price: this.price,
      desc: this.desc,
      status: this.status
    };
  }

  // 输出配置页数据
  toEditValues(){
    let attrValues = {};
    Object.keys(this.attrValues).map(attrId => {
      attrValues[`attrId${attrId}`] = this.attrValues[attrId];
    });

    return {
      name: this.name,
      cids: this.cids,
      attrs: attrValues,
      num: this.num,
      price: this.price,
      desc: this.desc
    };
  }

  // 备注，改变单个数组项的属性不会引起视图重绘，必须在数组中改变整个数组项
  // 在 product 实例初始化过程中调用 getCategories 方法，不会引起 Table 视图的重绘
  @action
  getCategories(){
    if ( !this.cids || !this.cids.length ) return;
    this.categories = [];
    this.cids.map(async cid => {
      if ( !cid ) return;
      const res = await this.category.getCategory({ cid });
      this.categories.push(res[0]);
    });
  }

  // 获取商品分类文案
  @computed
  get categoryTexts(){
    return this.categories.map(item => item.name).join(',');
  }

  // 获取属性
  @action
  async getAttributes(cid){
    const res = await this.attribute.getAttributes({ cid });
    return res;
  }

  // 获取商品状态文案
  @computed
  get statusText(){
    let text = StatusList.filter(item => item.value === this.status)[0].text;

    return text;
  }
  
  @action
  async getProduct(){
    this.set();
    const res = await Product.get({ id: this.id });
    if ( res ) this.set(res);
    return res || null;
  }
  
  @action
  async saveProduct(){
    const params = this.get();
    const res = await Product.save(params);
    return res;
  }
  
  @action
  async updateProduct(){
    const params = this.get();
    const res = await Product.update(params);
    return res;
  }
  
  @action
  async deleteProduct(){
    const res = await Product.del({ id: this.id });
    return res;
  }

}
