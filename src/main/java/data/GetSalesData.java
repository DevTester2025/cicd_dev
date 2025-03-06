package data;

import lombok.extern.slf4j.Slf4j;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
@Slf4j
public class GetSalesData {

    public static void main(String[] args) {
        log.info("5M records :"+getSalesRecord5M().size());
        log.info("2M records :"+getSalesRecord2M().size());
        log.info("iK records :"+getSalesRecord1K().size());
        log.info("Generick records :"+getSalesRecord(FilesEnum.SalesRecords1000.toString()).size());

        log.info("Arrays records :"+getSalesArray(FilesEnum.SalesRecords1000.toString()).length);

    }

    public static List<SalesVO> getSalesRecord5M(){
        List<SalesVO> originalList = CSVDataProcessor.readSalesCSVFile(FilesEnum.SalesRecords5M.toString());
        return originalList;
    }

    public static List<SalesVO> getSalesRecord2M(){
        List<SalesVO> originalList = CSVDataProcessor.readSalesCSVFile(FilesEnum.SalesRecords2M.toString());
        return originalList;
    }

    public static List<SalesVO> getSalesRecord1K(){
        List<SalesVO> originalList = CSVDataProcessor.readSalesCSVFile(FilesEnum.SalesRecords1000.toString());
        return originalList;
    }

    public static List<SalesVO> getSalesRecord(String records){
        List<SalesVO> originalList = CSVDataProcessor.readSalesCSVFile(records.toString());
        return originalList;
    }

    private static List<SalesVO> getSalesVOList(String records) {
        List<SalesVO> salesList = new ArrayList<>();
        salesList = getSalesRecord(records);
        return salesList;
    }

    public static SalesVO[] getSalesArray(String records) {
        List<SalesVO> salesList = getSalesVOList(records);
        SalesVO[] salesArr = new SalesVO[salesList.size()];
        salesArr = salesList.toArray(salesArr);
        return salesArr;
    }

    public static Map<Integer, SalesVO> getSalesMap(String records) {
        //convert list to map
        List<SalesVO> salesList = getSalesVOList(records);
        Map<Integer,SalesVO> salesMap = new HashMap<>();
        //salesMap = salesList.stream().collect(Collectors.toMap(SalesVO :: getOrderID, Function.identity()));
        salesMap = salesList
                .stream()
                .collect(Collectors.toMap(SalesVO::getOrderID,Function.identity(), (o,n)->n));

        salesMap = salesList
                .stream()
                .collect(Collectors.toMap(SalesVO::getOrderID,SalesVO-> SalesVO, (o,n)->n));

        salesMap = salesList
                .stream()
                .collect(Collectors.toMap(P -> P.getOrderID(), P-> P, (o,n)->n));

        return salesMap;
    }

    public static Set<SalesVO> getSalesSet(String records) {
        //convert list to Set
        List<SalesVO> salesList = getSalesVOList(records);
        Set<SalesVO> salesSet = new HashSet<>();
        salesSet = salesList.stream().collect(Collectors.toSet());
        return salesSet;
    }

    public static Map<Integer, Double> getSalesRevenueMap(String records) {
        Map<Integer, Double> salesRevenue =  new HashMap<>();
        List<SalesVO> salesVO = getSalesRecord(records);
        salesRevenue = salesVO.stream().collect(Collectors.toMap(SalesVO::getOrderID,SalesVO::getTotalRevenue , (n,o) ->n));
        salesRevenue = salesVO.stream().collect(Collectors.toMap(p -> p.getOrderID(),p -> p.getTotalRevenue() , (n,o) ->n));
        salesRevenue = salesVO.stream().collect(Collectors.toMap(p -> p.getOrderID(),SalesVO::getTotalRevenue , (n,o) ->n));
        return salesRevenue;
    }

    public static Set<Integer> getSalesOrderIdSet (String records) {
        Set<Integer> orderIdSet =  new HashSet<>();
        List<SalesVO> salesList = getSalesVOList(records);
        orderIdSet = salesList.stream().map(p->p.getOrderID()).collect(Collectors.toSet());
        return orderIdSet;
    }

    public static List<Double> getRevenueList(String records) {
        List<SalesVO> salesList = getSalesVOList(records);
        List<Double> revenueList = salesList.stream().map(p -> p.getTotalRevenue()).collect(Collectors.toList());
        return revenueList;
    }

    public static List<Double> getUnitPriceList(String records) {
        List<SalesVO> salesList = getSalesVOList(records);
        List<Double> revenueList = salesList.stream().map(p -> p.getUnitPrice()).collect(Collectors.toList());
        return revenueList;
    }

    public static List<Double> getUnitCostList(String records) {
        List<SalesVO> salesList = getSalesVOList(records);
        List<Double> unitCostList = salesList.stream().map(p -> p.getUnitCost()).collect(Collectors.toList());
        return unitCostList;
    }

    public static List<String> getCountryList(String records) {
        List<SalesVO> salesList = getSalesVOList(records);
        List<String> revenueList = salesList.stream().map(p -> p.getCountry()).collect(Collectors.toList());
        return revenueList;
    }

}
