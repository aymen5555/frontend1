import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProductService } from '../../../services/product.service';
import { ToastService } from '../../../services/toast.service';
import { StockDialogComponent } from '../stock-dialog/stock-dialog.component';
import { Product } from '../../../models/product.interface';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatDialogModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {
  private readonly productSvc = inject(ProductService);
  private readonly toastSvc = inject(ToastService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  products = signal<Product[]>([]);
  searchTerm = signal('');
  loading = signal(true);

  filteredProducts = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.products();
    return this.products().filter(p =>
      p.nom?.toLowerCase().includes(term) ||
      p.reference?.toLowerCase().includes(term) ||
      p.categorie?.nom?.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.productSvc.adminList().subscribe({
      next: (res) => {
        this.products.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.toastSvc.error('Erreur lors du chargement des produits.');
        this.loading.set(false);
      }
    });
  }

  deleteProduct(product: Product): void {
    if (confirm(`Voulez-vous vraiment supprimer le produit "${product.nom}" ?`)) {
      this.productSvc.delete(product.id).subscribe({
        next: (res) => {
          this.toastSvc.success(res.message || 'Produit supprimé avec succès.');
          this.loadProducts();
        },
        error: (err) => {
          this.toastSvc.error(err?.error?.message || 'Erreur lors de la suppression.');
        }
      });
    }
  }

  toggleActive(product: Product): void {
    // If deactivated, we can reactivate by calling update({ actif: true })
    const newStatus = !product.actif;
    this.productSvc.update(product.id, { actif: newStatus }).subscribe({
      next: () => {
        this.toastSvc.success(`Produit ${newStatus ? 'activé' : 'désactivé'} avec succès.`);
        this.loadProducts();
      },
      error: (err) => {
        this.toastSvc.error(err?.error?.message || 'Erreur lors du changement de statut.');
      }
    });
  }

  openStockDialog(product: Product): void {
    const dialogRef = this.dialog.open(StockDialogComponent, {
      width: '400px',
      data: { product }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.productSvc.updateStock(product.id, result).subscribe({
          next: () => {
            this.toastSvc.success('Stock mis à jour avec succès.');
            this.loadProducts();
          },
          error: (err) => {
            this.toastSvc.error(err?.error?.message || 'Erreur lors de la mise à jour du stock.');
          }
        });
      }
    });
  }

  editProduct(product: Product): void {
    this.router.navigate(['/admin/products/edit', product.id]);
  }

  isLowStock(product: Product): boolean {
    const qty = product.stock?.quantite_disponible ?? 0;
    const min = product.stock?.quantite_minimale ?? 5;
    return qty <= min;
  }
}
