app.initialize();

var db = window.openDatabase("Database", "1.0", "produto", 2000000);

document.addEventListener("deviceready", onDeviceReady(), false);

function onDeviceReady()
{
	db.transaction(createDB, errorDB, successDB);
}

//Trata erro de criação do Banco de Dados
function errorDB(err)
{
	alert("Erro: " + err);
}

//Executa se criou o Banco de Dados com sucesso
function successDB(){}

//Cria a tabela se a mesma não existir
function createDB(tx)
{
	tx.executeSql('CREATE TABLE IF NOT EXISTS produto (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, nome VARCHAR(50) NOT NULL, estoque INTEGER NOT NULL, preco REAL NOT NULL)');
	tx.executeSql('CREATE TABLE IF NOT EXISTS compra (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, id_prod INTEGER, qtd_compra INTEGER, valor_total REAL NOT NULL, FOREIGN KEY(id_prod) REFERENCES produto(id))');
}

//------------------------------------------------------------------FUNÇÕES DE PRODUTO------------------------------------------------------------------

//Prepara para incluir registro na tabela produto
function produto_insert()
{
	db.transaction(produto_insert_db, errorDB, successDB);
}

//Inclui registro na tabela produto
function produto_insert_db(tx)
{
	var nome = $("#produto_nome").val();
	var preco = $("#produto_preco").val();
	var estoque = $("#produto_estoque").val();

	//Insere valores na tabela	
	tx.executeSql('INSERT INTO produto (nome, estoque, preco) VALUES ("' + nome + '", "' + estoque + '", "' + preco + '")');

	alert('Produto Inserido');

	//Apaga o texto dos campos
	$("#produto_nome").val("");
	$("#produto_preco").val("");
	$("#produto_estoque").val("");

	//Atualiza a lista de produtos
	produto_view();
}

//Prepara para deletar registro da tabela produto
function produto_delete(produto_id)
{
	$("#produto_id_delete").val(produto_id);
	db.transaction(produto_delete_db,errorDB,successDB);
}

//Deleta registro da tabela Loja e chama a funcao produto_view()
function produto_delete_db(tx)
{
	var produto_id_delete = $("#produto_id_delete").val();
	tx.executeSql("DELETE FROM produto WHERE id = " + produto_id_delete);
	produto_view();
}

//Prepara pra chamar a função de listar os produtos
function produto_view()
{
	db.transaction(produto_view_db,errorDB,successDB);
}

//Select da tabela produtos
function produto_view_db(tx)
{
	tx.executeSql('SELECT * FROM produto',[],produto_view_data,errorDB);
}

//Lista todo a tabela produto na table
function produto_view_data(tx,results)
{
	$("#produto_listagem").empty();
	var len = results.rows.length;

	for(var i = 0; i <len;i++)
	{
	$("#produto_listagem").append("<tr class='produto_item_lista'>"+
		"<td><h3>" + results.rows.item(i).id + "</h3></td>"+
		"<td><h3>" + results.rows.item(i).nome + "</h3></td>"+
		"<td><h3>" + results.rows.item(i).estoque + "</h3></td>"+
		"<td><h3>" + results.rows.item(i).preco + "</h3></td>"+
		"<br><td><input type='button' class='btn btn-lg btn-danger' value='X' onclick='produto_delete(" + results.rows.item(i).id +")'> "
		+ "<input type='button' class='btn btn-lg btn-warning' value='Comprar' onclick='tela_listar_mostrar_tela_compra(" + results.rows.item(i).id +")'></td" + "</tr>");
	}
}

//------------------------------------------------------------------------FUNÇÕES DE COMPRA------------------------------------------------

//Prepara para incluir registro na tabela compra
function compra_insert()
{
	db.transaction(compra_insert_db, errorDB, successDB);
}

//Inclui registro na tabela compra
function compra_insert_db(tx)
{
	var id_prod_compra = $("#id_prod_compra").val();
	var quantidade_compra = $("#qtd_compra").val();
	var valor_unit_compra = $("#valor_unit_compra").val();

	var qtd_estoque = 0;

	var valor_total = (quantidade_compra * valor_unit_compra);

	tx.executeSql('SELECT * FROM produto WHERE id = '+ id_prod_compra + '', [], function(tx,results) 
	{
		for (var i = 0; i < results.rows.length; i++)
		{
			qtd_estoque = results.rows.item(i).qtd_estoque;
		}
		if (qtd_estoque < quantidade_compra) 
		{
			navigator.notification.beep(1);

			//Emite uma mensagem caso a compra exceda o estoque disponível
			return alert('Estoque insuficiente para compra'); 
		}
		else
		{
			//Emite mensagem caso a compra seja sucedida
			alert("Compra bem sucedida!") 
		}

		//Insert na tabela de compras e update na tabela de produto pra diminuir o valor do estoque
		tx.executeSql('INSERT INTO compra (id_prod, qtd_compra, valor_total) VALUES ("' + id_prod_compra + '", "' + quantidade_compra + '", "' + valor_total + '")');
		tx.executeSql('UPDATE produto SET estoque = (estoque - "' + quantidade_compra + '") WHERE id = "' + id_prod_compra + '"');

	}, null);

	//Atualiza o carrinho
	compra_view();
	produto_view();

	//Volta pra tela que lista os produtos
	tela_comprar_mostrar_tela_padrao();
}

/*
//Não tá funcionando
function compra_delete(compra_id)
{
	$("#compra_id_delete").val(compra_id);
	db.transaction(compra_delete_db,errorDB,successDB);
}

//Não tá funcionando
function compra_delete_db(tx)
{
	var compra_id_delete = $("#compra_id_delete").val();
	tx.executeSql("DELETE FROM compra WHERE id = " + compra_id_delete);
	compra_view();
}*/

//Prepara pra chamar a função de listar o carrinho
function compra_view()
{
	db.transaction(compra_view_db,errorDB,successDB);
}

//Select do carrinho que mostra o ID do produto comprado (o id da tabela produto), valor do produto, nome e valor total da compra
function compra_view_db(tx)
{
	tx.executeSql('SELECT t1.id_prod, t1.qtd_compra, t1.valor_total, t2.id, t2.nome FROM compra t1 INNER JOIN produto t2 on (t1.id_prod = t2.id)',[],compra_view_data,errorDB);
}

//Lista o select na table
function compra_view_data(tx,results)
{
	$("#compra_listagem").empty();
	var len = results.rows.length;

	//Variavel pra armazenar o valor total da compra
	var valorCalculado = 0;

	for(var i = 0; i <len;i++)
	{
	$("#compra_listagem").append("<tr class='compra_item_lista'>"+
		"<td><h3>" + results.rows.item(i).id + "</h3></td>"+
		"<td><h3>" + results.rows.item(i).nome + "</h3></td>"+
		"<td><h3>" + results.rows.item(i).qtd_compra + "</h3></td>"+
		"<td class='valor-calculado'><h3>" + results.rows.item(i).valor_total + "</h3></td>"
		+ "</tr>");
	}

	//Função que atribui o valor da compra individual na compra total
    $( ".valor-calculado" ).each(function() {
      	valorCalculado += parseFloat($( this ).text());
    });

	//Mostrando o valor total da compra no campo embaixo da listagem de carrinho
	var totalcampo = document.getElementById('total');
	totalcampo.value = parseFloat(valorCalculado).toFixed(2);
}

function finalizar_compra()
{
	db.transaction(finalizar_compra_db,errorDB,successDB);
}

function finalizar_compra_db(tx)
{
	tx.executeSql('DELETE FROM compra');
	alert("Compra Finalizada!");
	compra_view();
	tela_carrinho_mostrar_tela_padrao();
}

//----------------------------------------------------------FUNÇÕES PARA MOSTRAR TELAS------------------------------------------------------------

function mostrar_tela_incluir()
{
	$("#tela_padrao").hide();
	$("#tela_inclusao").show();
}

function mostrar_tela_listar()
{
	$("#tela_padrao").hide();
	$("#tela_listar").show();
}

function mostrar_tela_comprar()
{
	$("#tela_padrao").hide();
	$("#tela_carrinho").show();
}

function tela_incluir_mostrar_tela_padrao()
{
	$("#tela_inclusao").hide();
	$("#tela_padrao").show();
}

function tela_listar_mostrar_tela_padrao()
{
	$("#tela_listar").hide();
	$("#tela_padrao").show();
}

function tela_listar_mostrar_tela_compra(_id)
{
	//Variáveis que guardam os dados do produto que a pessoa quer comprar
	var id_prod_compra = document.getElementById('id_prod_compra');
	var nome_compra = document.getElementById('nome_compra');
    var valor_unit_compra = document.getElementById('valor_unit_compra');
    var qtd_compra = document.getElementById('qtd_compra');
    
    id_prod_compra.value = _id;
    
    db.transaction(function(tx) {
        tx.executeSql('SELECT * FROM produto WHERE id=?', [_id], function (tx, resultado) {
            var rows = resultado.rows[0];

            //Atribui o valor das variáveis no campo pra que o usuário não se preocupe em digitar o ID do produto e o Valor individual do produto
            id_prod_compra.value = rows.id;
            nome_compra.value = rows.nome;
            valor_unit_compra.value = rows.preco;
            qtd_compra.value = '';
        });
    });

	$("#tela_listar").hide();
	$("#tela_comprar").show();
}

function tela_comprar_mostrar_tela_listar()
{
	$("#tela_comprar").hide();
	$("#tela_listar").show();
}

function tela_comprar_mostrar_tela_padrao()
{
	$("#tela_comprar").hide();
	$("#tela_padrao").show();
}

function tela_carrinho_mostrar_tela_padrao()
{
	$("#tela_carrinho").hide();
	$("#tela_padrao").show();
}