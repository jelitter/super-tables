import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AboutComponent } from '@components/about/about.component';
import { TablesComponent } from '@components/tables/tables.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgParticlesModule } from 'ng-particles';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent, TablesComponent, AboutComponent],
  imports: [
    AppRoutingModule,
    BrowserAnimationsModule,
    BrowserModule,
    CommonModule,
    FormsModule,
    FormsModule,
    HttpClientModule,
    NgParticlesModule,
    NgSelectModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
