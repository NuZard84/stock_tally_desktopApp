export namespace models {
	
	export class Item {
	    item_no: string;
	    quantity: number;
	    alternates: string[];
	
	    static createFrom(source: any = {}) {
	        return new Item(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.item_no = source["item_no"];
	        this.quantity = source["quantity"];
	        this.alternates = source["alternates"];
	    }
	}
	export class Finish {
	    name: string;
	    items: Item[];
	
	    static createFrom(source: any = {}) {
	        return new Finish(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.items = this.convertValues(source["items"], Item);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Company {
	    company: string;
	    finishes: Finish[];
	
	    static createFrom(source: any = {}) {
	        return new Company(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.company = source["company"];
	        this.finishes = this.convertValues(source["finishes"], Finish);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class FileInfo {
	    name: string;
	    path: string;
	    original_path: string;
	    last_used: string;
	
	    static createFrom(source: any = {}) {
	        return new FileInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.path = source["path"];
	        this.original_path = source["original_path"];
	        this.last_used = source["last_used"];
	    }
	}
	
	
	export class LowStockItem {
	    company: string;
	    finish: string;
	    item_no: string;
	    quantity: number;
	    file_path: string;
	
	    static createFrom(source: any = {}) {
	        return new LowStockItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.company = source["company"];
	        this.finish = source["finish"];
	        this.item_no = source["item_no"];
	        this.quantity = source["quantity"];
	        this.file_path = source["file_path"];
	    }
	}

}

